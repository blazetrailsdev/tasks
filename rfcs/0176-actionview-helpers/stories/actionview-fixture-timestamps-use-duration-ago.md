---
title: "actionview fixtures: stamp created_at with N.hours.ago.to_fs(:db), not globalThis.Date"
status: ready
updated: 2026-10-18
rfc: "0176-actionview-helpers"
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

Rails' actionview fixtures stamp `created_at` with `<%= 6.hours.ago.to_fs(:db) %>`
(`vendor/rails/v8.0.2/actionview/test/fixtures/replies.yml`, `topics.yml`). trails'
`packages/actionview/src/test-helpers/fixtures/replies.yml` and `topics.yml` instead compute
`new globalThis.Date(globalThis.Date.now() - N).toISOString()...` (trails#9032 switched them
to `globalThis.Date` because inside the fixture `RenderContext` binding `Date` resolves to Ruby's
Date). The converged shape is the Duration form: `ActiveSupport::Duration` reachable from the
fixture binding (it is not seated on the `ActiveSupport` namespace today:
`packages/activesupport/src/namespaces.ts`), so the YAML reads e.g.
`<%= ActiveSupport.Duration.hours(6).ago().toFs(":db") %>` or the numeric-extension spelling the
repo settles on.

## Acceptance criteria

- `ActiveSupport.Duration` (or the settled numeric-ext form) is reachable from fixture ERB.
- `replies.yml` / `topics.yml` use the Rails `N.hours.ago.to_fs(:db)` shape, no `globalThis.Date`.
- `render-partial-with-record-identification.test.ts` and `partial-rendering-query.test.ts` stay green.
