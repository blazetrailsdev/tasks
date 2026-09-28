---
title: "dom_id / dom_class are not reachable from templates (FormHelper does not include RecordIdentifier)"
status: ready
updated: 2026-09-28
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found re-verifying the README quickstart (trails#8195) on `main` at `bace3edab4`.
The ported scaffold partial `_post.html.tse` opens with `<div id="<%= domId(post) %>">`,
as Rails' `partial.html.erb.tt` uses `dom_id`. Rendering it fails:

```text
ActionView::Template::Error (domId is not defined)
```

Rails exposes `dom_id` / `dom_class` to templates through `FormHelper`, which does
`include RecordIdentifier` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_helper.rb:120`).
trails' view `Base` takes every function exported from `packages/actionview/src/helpers/index.ts`
(`base.ts:18,46-50`). `domId` / `domClass` live in `packages/actionview/src/record-identifier.ts:15`
and are re-exported only from the package root (`index.ts:72`), so no template sees them.

## Acceptance criteria

- `dom_id` / `dom_class` reach the view through `FormHelper`, mirroring
  `form_helper.rb:120`, so `<%= domId(record) %>` renders in a template.
- A view test renders `domId(record)` and `domClass(record)` from a template.
