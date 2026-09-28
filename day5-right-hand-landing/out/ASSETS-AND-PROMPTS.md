# Day 5 — Right Hand landing page (v2): assets and prompts

Built 2026-09-28 for the Pareto Talent Bootcamp, Day 5 homework.

## Files

| File | Use |
|---|---|
| `landing-page-v2.html` | Full page (open in a browser, or host as the preview URL) |
| `landing-page-v2-GHL-snippet.html` | Same page for a GoHighLevel Code element: every CSS rule scoped under `#rh` |
| `popup-exit-intent.html` | Optional popup: opens at the end of the page or when the visitor starts to leave (desktop and phone, once per visit). Paste at the end of the page or into its own Code element |

## Brand system

- **Logo and favicon:** "Right Hand" wordmark with an 80/20 mark. A silver block (80%) and a thin ember bar (20%) sit on a navy square. The thin bar recurs across the page as the one accent: eyebrow marks, slider fill, the timeline, the scroll progress bar.
- **Colours:** midnight navy `#070C1A` / `#16295F`, silver `#C3C9D5`, ember `#E0512B` (plus porcelain `#EDEFF3` as the light surface).
- **Fonts (Google Fonts):** Archivo, with the variable width axis used for display and numbers, and Newsreader italic for quotes.
- **Icon set:** Lucide v1.48.0 (ISC license), inline SVG sprite.

## Images

| Where | Source | License |
|---|---|---|
| Hero portrait (Kasim Aslam) | paretotalent.com/img/kasim-headshot.jpg | Pareto's own photo, used with permission* |
| Ivan section (Kasim + Ivan) | Pareto Talent media CDN | Pareto's own photo, used with permission* |
| Founder faces ×3 | paretotalent.com/img | Pareto's own photos, used with permission* |
| Delegation wall ×6 | images.unsplash.com: photo-1499750310107-5fef28a66643, photo-1506784983877-45594efa4cbe, photo-1484480974693-6ca0a78fb36b, photo-1551288049-bebda4e38f71, photo-1460925895917-afdab827c52f, photo-1517842645767-c639042777db | Unsplash License (free commercial use) |

\* Ivan Bunin, Day 5 class: "If you want to use custom images, I give you permission to use them in any way that you want."

## Prompts used

1. Offer: Hormozi Grand Slam inverse interview, answered from Kasim's Second Brain (`offer-grand-slam.md`).
2. Copy: every section written before the build (`landing-copy.md`), then locked in `DESIGN-HANDOFF-landing-page.md`.
3. Design: Claude Code with the ui-ux-pro-max and frontend-design skills. The prompt: "Build a website worth $10K for Kasim using DESIGN-HANDOFF-landing-page.md; get inspired by the attached design prompts (cinematic GSAP hero, hero-parallax scrolling wall) and the nexus-studio template, or create something better."
4. Reference components adapted to vanilla JS (no React or GSAP, so the page pastes into GoHighLevel):
   - Cinematic hero: physical depth card with mouse-lit sheen, silver gradient type, film grain and grid, tactile buttons, progress ring.
   - Hero parallax: rows of cards sliding in opposite directions, with a 3D tilt that flattens on scroll.
