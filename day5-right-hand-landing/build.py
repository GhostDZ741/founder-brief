import re, pathlib
src = pathlib.Path(__file__).parent.joinpath('src/snippet.html').read_text()
fav = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Crect width='36' height='36' rx='10' fill='%2316295F'/%3E"
       "%3Crect x='7' y='8' width='16' height='20' rx='2.6' fill='%23E9ECF2'/%3E%3Crect x='25' y='8' width='4' height='20' rx='2' fill='%23E0512B'/%3E%3C/svg%3E")
head = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Right Hand Program — 40 hours back or your next month is free</title>
<meta name="description" content="Concept landing page for Pareto Talent's Right Hand Program. Built by Hakim Boukeffoussa for the Pareto Talent Bootcamp, Day 5.">
<meta name="theme-color" content="#070C1A">
<link rel="icon" href="{fav}">
<style>html,body{{margin:0;background:#070C1A}}html{{scroll-behavior:smooth}}@media (prefers-reduced-motion:reduce){{html{{scroll-behavior:auto}}}}</style>
</head><body>
"""
pathlib.Path(__file__).parent.joinpath('out/landing-page-v2.html').write_text(head + src + "\n</body></html>\n")
pathlib.Path(__file__).parent.joinpath('out/landing-page-v2-GHL-snippet.html').write_text(src)
print('built', len(head+src), 'bytes full;', len(src), 'bytes snippet')
