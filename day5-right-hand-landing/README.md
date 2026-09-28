# Day 5: Right Hand Program landing page (Pareto Talent Bootcamp)

Concept landing page for Pareto Talent's Right Hand Program. Homework by Hakim Boukeffoussa; not an official Pareto page.

## Files

| Path | What it is |
|---|---|
| `out/landing-page-v2-GHL-snippet.html` | Paste into a GoHighLevel **Code** element. Every CSS rule is scoped under `#rh`. |
| `out/landing-page-v2.html` | Same page as a full HTML document, for any static host. |
| `out/popup-exit-intent.html` | Optional popup: opens at the end of the page or when the visitor starts to leave (desktop and phone, once per visit). Paste after the page or into its own Code element. |
| `out/schema-jsonld.html` | The JSON-LD schema markup on its own. It is already inside both page files; only use this for GoHighLevel's head tracking code instead. |
| `out/ASSETS-AND-PROMPTS.md` | Brand system, image sources and licenses, prompts used: the homework's "prompts and assets" list. |
| `src/snippet.html` | Source of the page. Edit this, then run `python3 build.py` to regenerate both page files in `out/`. |
| `tests/` | Playwright checks used during the build (layout at 7 widths, calculator math, popup triggers). |
| `skills/ui-ux-pro-max-skill.zip` | The ui-ux-pro-max design skill (MIT license, by Next Level Builder), packaged for upload to claude.ai. |

## Keeping the design skills

- **frontend-design** (Anthropic): install it on your claude.ai account from the Anthropic plugin directory.
- **ui-ux-pro-max**: upload `skills/ui-ux-pro-max-skill.zip` as a custom skill in claude.ai settings. In local Claude Code, run
  `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`.
