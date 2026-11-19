---
title: "Seed parity_days so the parity chart can be shot and checked under a forced theme"
status: done
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 13
pr: trailmap#171
claim: "2026-11-18T22:21:35Z"
assignee: "view-tests-build-views-in-a-fresh-worktree"
blocked-by: null
closed-reason: null
---

## Context

trailmap#164 laid `/graphs/parity` out to the style guide. It put ringo's
generated `parity.css` in a cascade layer under `application.css`, through
`app/assets/stylesheets/parity-page.css`, and themed ringo's chart tokens
(`--grid`, `--axis`, `--s1`..`--s8`) for `data-theme`. On a local boot the
`parity_days` projection is empty (no `STATS_DB`), so the page renders only
its "Nothing projected yet" card. No screenshot or test has seen the chart
itself, its segmented filter, legend or tooltip under the new layer, or under
a forced `data-theme` that disagrees with the OS.

## Acceptance criteria

- A local boot or test fixture writes a few `parity_days` rows, so
  `/graphs/parity` draws its charts without a stats database.
- Screenshots of the drawn chart in light, dark, `data-theme="light"` on a
  dark OS, and at 390px, in both apps.
