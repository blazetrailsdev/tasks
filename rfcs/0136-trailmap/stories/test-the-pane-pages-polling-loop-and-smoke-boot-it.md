---
title: "trailmap: the pane page's polling loop has no automated test, and smoke-boot never requests the page"
status: draft
updated: 2026-10-08
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#45 added `/panes/<n>`. Its decisions are unit-tested (`pane-format.js`), but the polling
loop in `app/assets/javascripts/pane.js` — timers, `visibilitychange`, Pause/Resume, sticking to the
bottom — has no automated test. It was checked by hand in headless Chromium against a stub ringo,
twice, with throwaway scripts that are not in the repo. A review found a real bug in exactly that
untested part (a pending timer delayed the first poll after returning to the tab).

`scripts/smoke-boot.sh` also never requests `/panes/<n>` or `/fleet/pane/<n>/screen`, so a
production boot that 500s on either goes unnoticed. It does compare every built asset byte for byte,
so `pane.js` itself is covered.

## Acceptance criteria

- `smoke-boot.sh` asks a production boot for `/panes/42` (200, carries
  `data-screen-path="/fleet/pane/42/screen"`), `/panes/4x` (404), and `/fleet/pane/4x/screen` (400).
- The loop in `pane.js` has a test that runs in CI: no request while hidden, an immediate request on
  return and on Resume, no doubled loop, no request after `exists: false`, and the scroll position
  held when the reader has scrolled up. Either extract the scheduler from the DOM so vitest can
  drive it with fake timers, or add a browser test — decide which and say why.
