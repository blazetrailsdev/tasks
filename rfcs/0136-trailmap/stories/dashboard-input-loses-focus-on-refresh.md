---
title: "Find and fix the dashboard input that loses focus on a refresh"
status: done
updated: 2026-11-23
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#195
claim: "2026-11-22T22:18:55Z"
assignee: "dashboard-input-loses-focus-on-refresh"
blocked-by: null
closed-reason: null
---

The user reports that, on the fleet dashboard, an input loses focus after a time or data refresh. That input is not identified yet.

trailmap#192 shows the session list is not the cause. `keepWhileRepainting` (app/assets/javascripts/dashboard.js:159) restores value, focus, caret and checked state for every `[data-keep]` element. The e2e case "typing survives a repaint" (scripts/dashboard-e2e.ts) proves this for a question's Other box, its pick, and the composer textarea.

Still unchecked: other hosts whose `innerHTML` is replaced on a poll (dashboard.js:224 suggestion slot, :568 usage blocks, :589 queue section, :1149 bundle list, :938/:942 palette). Also any input rendered without `data-keep`.

Acceptance:

- Identify the field that loses focus, with the user if needed.
- Reproduce it as a dashboard-e2e case, then fix it so the case passes.
