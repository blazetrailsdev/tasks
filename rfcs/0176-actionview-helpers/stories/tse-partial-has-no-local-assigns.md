---
title: "A .tse partial cannot read an optional local, so every caller must pass it"
status: done
updated: 2026-10-28
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9149
claim: "2026-10-28T11:49:47Z"
assignee: "parity-maps-ruby-tracker-onto-tse-tracker-parser-arm"
blocked-by: null
closed-reason: null
---

## Context

Found building trailmap#82. trailmap's `app/views/shared/_status-state.html.tse` gained an optional `label` local, which only the story page passes. In Rails the partial reads `local_assigns[:label]`, or declares `<%# locals: (status:, label: nil) %>`, and the other callers pass nothing.

`local_assigns` is ported (`port-rails-local-assigns-and-strict-locals-test`, done; `actionview/dist/template.js:315-333`). But a `.tse` partial reads its locals as bare identifiers, so a local the caller omits is not in scope. trailmap had to pass `label: null` from every caller, including `rfc-pages/show.html.tse`.

Expected shape: `localAssigns` is in scope in a `.tse` template, and a strict-locals magic comment with defaults works.

## Acceptance criteria

- A `.tse` partial can read `localAssigns.label` (undefined when the caller omitted it).
- A `.tse` strict-locals declaration with a default (`label = null`) lets callers omit the local.
- A test covers both.
