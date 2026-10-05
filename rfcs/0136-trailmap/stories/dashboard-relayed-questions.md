---
title: "trailmap: the dashboard's relayed-questions panel"
status: draft
updated: 2026-10-05
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `port-the-dashboards-control-surface`, whose first slice (the per-row merge, dismiss, clear-failed and respawn-fixer buttons) landed in trailmap#37. Same shape as that slice: the control posts to ringo, which keeps the state; a button is drawn by `control` and carries `data-action`; `controlRequest` and `controlOutcome` in `app/assets/javascripts/fleet-format.js` decide the request and what the button shows, and are unit-tested; `app/assets/javascripts/dashboard.js` has the one click listener. `webhook/dashboard.go` is not touched.

The relayed-questions panel, "Agents waiting on you": `renderAsks` (`webhook/dashboard.go:622`), `answerAsk`, `answerAskFree`. This panel renders MODEL-AUTHORED text; it is the reason ringo has `escHtml` and `escAttr` (`:614-620`). Use the existing `esc`.

## Acceptance criteria

- [ ] Questions render and can be answered by option or free text.
- [ ] Every piece of model-authored text is escaped, with a test that feeds it markup and an attribute-breaking quote.
