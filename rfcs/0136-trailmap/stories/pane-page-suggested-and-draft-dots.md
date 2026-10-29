---
title: "trailmap: suggested and draft dots on the pane page"
status: blocked
updated: 2026-10-29
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-10-29T12:51:28Z"
assignee: "loopback-only-guard-as-a-private-method-by-name"
blocked-by: "trailmap half done in this PR; needs ringo (btwebooks) per-pane endpoint to send pane_input"
closed-reason: null
---

## Context

trailmap#80 drew `suggested` and `draft` pane dots on the fleet page from the input-box text in ringo's `/events` envelope (`pane_input` / `paneInput`). The pane page (`/panes/<n>`) can't do the same. Its state comes from ringo's per-pane endpoint, and `screenStep` (`app/assets/javascripts/pane-format.js:61`) keeps only `status`, `cwd`, `lines`, `hash` and `html` from it. That endpoint sends no input text, so `statusHtml` (`pane-format.js:103`) calls `paneDot(state.status)` without it. A suggested or draft pane then shows the idle ○ beside the word "suggested"/"draft".

## Acceptance criteria

- [ ] ringo's per-pane endpoint returns the input-box text (`pane_input`, left out when empty), from the same `parseInputBox` classifier.
- [ ] `screenStep` keeps it, and `statusHtml` passes it to `paneDot(state.status, input)`.
- [ ] A pane-format test covers a suggested and a draft pane that render the filled dot with the escaped title.
