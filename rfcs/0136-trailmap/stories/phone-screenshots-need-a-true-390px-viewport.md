---
title: "trailmap: 390px screenshots taken with Chrome's new headless mode are laid out wider and cropped"
status: draft
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`backlog-rows-overflow-a-phone-screen` reported `/backlog` overflowing at
390px from the screenshot in trailmap#36. trailmap#63 measured it: at a true
390px viewport no row, tab or pager element crosses the right edge on any of
the six tabs (600 rows; document width 375px). The clipped picture reproduces
only with `google-chrome --headless=new --window-size=390,...`, which lays the
page out at a wider minimum window and crops the capture.
`chrome-headless-shell` (the playwright build) reports `innerWidth` 390 and
shows the page as a phone does.

## Acceptance criteria

- [ ] CLAUDE.md's screenshot rule names a recipe that yields a real 390px layout, and how to check it (`innerWidth`)
- [ ] The #36 screenshot is noted as an artefact where it is referenced
