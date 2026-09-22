/* ==========================================================================
   Founder Brief — frontend
   Vanilla JavaScript. No build step. All AI text is rendered with
   textContent, never innerHTML.
   ========================================================================== */

(function () {
  "use strict";

  /* ── Configuration ──────────────────────────────────────────────────
     Set window.FOUNDER_BRIEF_API_URL in index.html when the frontend and
     the API live on different origins (e.g. GitHub Pages + Vercel).
     Empty string → same-origin /api/analyze, which is what `vercel dev`
     and a Vercel deployment both serve.
  ------------------------------------------------------------------- */
  var API_URL = window.FOUNDER_BRIEF_API_URL || "/api/analyze";

  var MAX_INPUT = 10000;

  var EXAMPLE_TEXT =
    "The landing page is delayed because the final copy was not available to the " +
    "designer. The copy has now been completed and sent over. I followed up this " +
    "morning and confirmed the designer received it. The client is expecting an " +
    "update today, and we have a meeting tomorrow. I think we should be okay, but " +
    "I haven't confirmed the revised delivery time yet.";

  var FIELDS = [
    { key: "situation",       label: "Situation",       empty: "Not stated in the update." },
    { key: "impact",          label: "Impact",          empty: "No impact was stated." },
    { key: "action_taken",    label: "Action Taken",    empty: "No action was reported." },
    { key: "recommendation",  label: "Recommendation",  empty: "No recommendation — nothing in the update supports one." },
    { key: "next_step",       label: "Next Step",       empty: "No next step was provided." },
    { key: "decision_needed", label: "Decision Needed", empty: "No decision is required based on the available information." }
  ];

  var CS = [
    { key: "clear",          label: "Clear" },
    { key: "complete",       label: "Complete" },
    { key: "concise",        label: "Concise" },
    { key: "call_to_action", label: "Call to Action" }
  ];

  var GENERIC_ERROR = "The AI service is temporarily unavailable. Please try again.";

  /* ── DOM ──────────────────────────────────────────────────────────── */

  var $ = function (id) { return document.getElementById(id); };

  var els = {
    textarea:  $("update"),
    counter:   $("counter"),
    example:   $("example"),
    analyze:   $("analyze"),
    status:    $("status"),
    empty:     $("empty-state"),
    result:    $("result"),
    fields:    $("brief-fields"),
    fourCs:    $("four-cs"),
    missing:   $("missing"),
    missingWrap: $("missing-wrap"),
    toast:     $("toast")
  };

  var state = { loading: false, brief: null, requestId: 0 };

  /* ── Small helpers ────────────────────────────────────────────────── */

  function setStatus(message, kind) {
    els.status.textContent = message || "";
    if (kind) {
      els.status.dataset.kind = kind;
    } else {
      delete els.status.dataset.kind;
    }
  }

  var toastTimer, toastHideTimer;

  function toast(message, kind) {
    clearTimeout(toastTimer);
    clearTimeout(toastHideTimer);
    els.toast.textContent = message;
    els.toast.dataset.kind = kind || "ok";
    els.toast.hidden = false;
    requestAnimationFrame(function () { els.toast.dataset.show = "true"; });
    toastTimer = setTimeout(function () {
      els.toast.dataset.show = "false";
      toastHideTimer = setTimeout(function () { els.toast.hidden = true; }, 240);
    }, 2400);
  }

  function updateCounter() {
    var n = els.textarea.value.length;
    els.counter.textContent = n.toLocaleString("en-US") + " / " + MAX_INPUT.toLocaleString("en-US");
    els.counter.dataset.over = n > MAX_INPUT ? "true" : "false";
  }

  function setBusy(busy) {
    els.analyze.disabled = busy;
    els.example.disabled = busy;
    els.analyze.classList.toggle("is-loading", busy);
    els.analyze.textContent = busy ? "Analyzing…" : "Analyze with AI";
    els.analyze.setAttribute("aria-busy", String(busy));
  }

  /* ── Response handling ────────────────────────────────────────────── */

  /* Map a failed response to a short, user-facing sentence. The server
     sends { error, code }; `code` is a coarse tag, never a stack trace. */
  function errorMessageFor(status, data) {
    var msg  = data && typeof data.error === "string" ? data.error.trim() : "";
    var code = data && typeof data.code  === "string" ? data.code : "";

    if (status === 429 || code === "rate_limit") {
      return "You've reached the current usage limit. Please try again later.";
    }
    if (code === "config") {
      return msg || "The AI service is not configured yet. Check the server environment variables.";
    }
    if (code === "validation") {
      return msg || "That update could not be processed.";
    }
    if (code === "unavailable") {
      return msg || GENERIC_ERROR;
    }
    if (status >= 500) return GENERIC_ERROR;
    if (status >= 400) return msg || "That update could not be processed.";
    return "Something went wrong. Please try again.";
  }

  /* Structural validation of whatever the API returned. The server already
     validates, but the client refuses to render anything that does not
     match the expected shape. */
  function normalise(raw) {
    if (!raw || typeof raw !== "object") return null;

    var str = function (v) { return typeof v === "string" ? v.trim() : ""; };

    var brief = { four_cs: {}, missing_information: [] };

    for (var i = 0; i < FIELDS.length; i++) {
      brief[FIELDS[i].key] = str(raw[FIELDS[i].key]);
    }

    if (Array.isArray(raw.missing_information)) {
      brief.missing_information = raw.missing_information
        .filter(function (v) { return typeof v === "string" && v.trim(); })
        .map(function (v) { return v.trim(); });
    }

    if (!brief.situation) return null; // nothing meaningful to show

    var cs = raw.four_cs && typeof raw.four_cs === "object" ? raw.four_cs : {};
    for (var j = 0; j < CS.length; j++) {
      var item = cs[CS[j].key];
      item = item && typeof item === "object" ? item : {};
      brief.four_cs[CS[j].key] = {
        status: item.status === "pass" ? "pass" : "warning", // anything unexpected → warning
        reason: str(item.reason)
      };
    }

    return brief;
  }

  function words(value) {
    return value.trim().split(/\s+/).filter(Boolean).length;
  }

  /* Frontend structural checks, per the Four Cs spec. These can only
     DOWNGRADE a status the model reported as "pass" — the client never
     upgrades a warning. */
  function effectiveFourCs(brief) {
    var out = {};
    for (var i = 0; i < CS.length; i++) {
      var key = CS[i].key;
      out[key] = { status: brief.four_cs[key].status, reason: brief.four_cs[key].reason };
    }

    var downgrade = function (key, reason) {
      if (out[key].status === "warning") return; // the model already flagged it — keep its reason
      out[key].status = "warning";
      out[key].reason = reason;
    };

    if (words(brief.situation) < 3 || words(brief.impact) < 3) {
      downgrade("clear", "The brief is missing a usable situation or impact statement.");
    }
    if (brief.missing_information.length > 0) {
      downgrade("complete", "Relevant information is missing, so the reader would need to ask before acting.");
    }
    if (words(brief.next_step) < 3 && words(brief.decision_needed) < 3) {
      downgrade("call_to_action", "The brief ends without a concrete next step or a stated decision.");
    }

    return out;
  }

  /* ── Rendering (textContent only — never innerHTML) ───────────────── */

  function render(brief) {
    // Brief fields
    var frag = document.createDocumentFragment();

    FIELDS.forEach(function (field) {
      var value = brief[field.key];
      var isEmpty = words(value) === 0;

      var row = document.createElement("div");
      var dt = document.createElement("dt");
      var dd = document.createElement("dd");

      dt.textContent = field.label;
      dd.textContent = isEmpty ? field.empty : value;
      if (isEmpty) dd.dataset.empty = "true";

      row.appendChild(dt);
      row.appendChild(dd);
      frag.appendChild(row);
    });

    els.fields.textContent = "";
    els.fields.appendChild(frag);

    // 4C check
    var cs = effectiveFourCs(brief);
    var csFrag = document.createDocumentFragment();

    CS.forEach(function (item) {
      var entry = cs[item.key];
      var isPass = entry.status === "pass";

      var li = document.createElement("li");
      li.dataset.status = entry.status;

      var icon = document.createElement("span");
      icon.className = "cs-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = isPass ? "✓" : "⚠";

      var body = document.createElement("div");

      var head = document.createElement("p");
      head.className = "cs-head";

      var name = document.createElement("span");
      name.className = "cs-name";
      name.textContent = item.label;

      var verdict = document.createElement("span");
      verdict.className = "cs-verdict";
      verdict.textContent = isPass ? "Pass" : "Needs work";

      var reason = document.createElement("p");
      reason.className = "cs-reason";
      reason.textContent = entry.reason || (isPass ? "No issues detected." : "No explanation provided.");

      head.appendChild(name);
      head.appendChild(verdict);
      body.appendChild(head);
      body.appendChild(reason);

      li.appendChild(icon);
      li.appendChild(body);
      csFrag.appendChild(li);
    });

    els.fourCs.textContent = "";
    els.fourCs.appendChild(csFrag);

    // Missing information (secondary)
    els.missing.textContent = "";
    if (brief.missing_information.length > 0) {
      var mFrag = document.createDocumentFragment();
      brief.missing_information.forEach(function (text) {
        var li = document.createElement("li");
        li.textContent = text;
        mFrag.appendChild(li);
      });
      els.missing.appendChild(mFrag);
      els.missingWrap.hidden = false;
    } else {
      els.missingWrap.hidden = true;
    }

    els.empty.hidden = true;
    els.result.hidden = false;
  }

  /* ── Analyze ──────────────────────────────────────────────────────── */

  function analyze() {
    if (state.loading) return; // one request at a time

    var message = els.textarea.value.trim();

    if (!message) {
      setStatus("Please paste an update before analyzing.", "error");
      els.textarea.focus();
      return;
    }
    if (message.length > MAX_INPUT) {
      setStatus("That update is too long. Please shorten it to " +
                MAX_INPUT.toLocaleString("en-US") + " characters or fewer.", "error");
      return;
    }

    var requestId = ++state.requestId;
    state.loading = true;
    setBusy(true);
    setStatus("Analyzing your update…", "busy");

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message })
    })
      .then(function (res) {
        return res.json()
          .catch(function () { return null; })
          .then(function (data) { return { res: res, data: data }; });
      })
      .then(function (out) {
        if (requestId !== state.requestId) return; // superseded by a reset or a newer run

        if (!out.res.ok) {
          if (out.data === null) {
            setStatus("The API endpoint could not be reached. If the frontend is hosted " +
                      "separately, set window.FOUNDER_BRIEF_API_URL to your deployed API.", "error");
          } else {
            setStatus(errorMessageFor(out.res.status, out.data), "error");
          }
          return;
        }

        var brief = normalise(out.data);
        if (!brief) {
          setStatus("The AI returned a response that could not be read. Please try again.", "error");
          return;
        }

        state.brief = brief;
        render(brief);
        setStatus("Brief ready.", "ok");
      })
      .catch(function (err) {
        if (requestId !== state.requestId) return;
        console.error("Founder Brief: request failed", err);
        setStatus("Could not reach the server. Check your connection and try again.", "error");
      })
      .then(function () {
        if (requestId !== state.requestId) return;
        state.loading = false;
        setBusy(false);
      });
  }

  /* ── Copy formats ─────────────────────────────────────────────────── */

  function briefText(b) {
    var lines = ["FOUNDER BRIEF", ""];
    FIELDS.forEach(function (f) {
      lines.push(f.label.toUpperCase(), b[f.key] || f.empty, "");
    });
    if (b.missing_information.length) {
      lines.push("MISSING INFORMATION");
      b.missing_information.forEach(function (m) { lines.push("- " + m); });
      lines.push("");
    }
    return lines.join("\n").trim() + "\n";
  }

  function slackText(b) {
    var lines = ["*Founder Brief*", ""];
    FIELDS.forEach(function (f) {
      lines.push("*" + f.label + "*", b[f.key] || f.empty, "");
    });
    if (b.missing_information.length) {
      lines.push("*Missing Information*");
      b.missing_information.forEach(function (m) { lines.push("• " + m); });
      lines.push("");
    }
    return lines.join("\n").trim() + "\n";
  }

  /* Email body only: no subject line, no greeting, no invented recipient. */
  function emailText(b) {
    var lines = [];
    FIELDS.forEach(function (f) {
      lines.push(f.label, b[f.key] || f.empty, "");
    });
    if (b.missing_information.length) {
      lines.push("Missing information");
      b.missing_information.forEach(function (m) { lines.push("- " + m); });
      lines.push("");
    }
    return lines.join("\n").trim() + "\n";
  }

  function copy(text) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      toast("Copying is not available in this browser.", "error");
      return;
    }
    navigator.clipboard.writeText(text).then(
      function () { toast("Copied to clipboard."); },
      function () { toast("Couldn't copy — clipboard access was blocked.", "error"); }
    );
  }

  /* ── Reset ────────────────────────────────────────────────────────── */

  function reset() {
    state.requestId++;      // discard any in-flight response
    state.loading = false;
    state.brief = null;

    els.textarea.value = "";
    els.result.hidden = true;
    els.empty.hidden = false;
    els.fourCs.textContent = "";
    els.fields.textContent = "";
    els.missing.textContent = "";
    els.missingWrap.hidden = true;

    setBusy(false);
    setStatus("");
    updateCounter();
    els.textarea.focus();
  }

  /* ── Wiring ───────────────────────────────────────────────────────── */

  els.example.addEventListener("click", function () {
    els.textarea.value = EXAMPLE_TEXT;
    updateCounter();
    setStatus("");
    els.textarea.focus();
  });

  els.analyze.addEventListener("click", analyze);
  els.textarea.addEventListener("input", updateCounter);

  els.textarea.addEventListener("keydown", function (e) {
    // Ctrl/Cmd + Enter submits, which is what people expect in a text box.
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      analyze();
    }
  });

  $("copy-brief").addEventListener("click", function () {
    if (state.brief) copy(briefText(state.brief));
  });
  $("copy-slack").addEventListener("click", function () {
    if (state.brief) copy(slackText(state.brief));
  });
  $("copy-email").addEventListener("click", function () {
    if (state.brief) copy(emailText(state.brief));
  });
  $("reset").addEventListener("click", reset);

  updateCounter();
})();
