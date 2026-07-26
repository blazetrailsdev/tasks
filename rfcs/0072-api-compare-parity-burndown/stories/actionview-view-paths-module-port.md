---
title: "actionview-view-paths-module-port"
status: claimed
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-26T13:26:54Z"
assignee: "actionview-view-paths-module-port"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::ViewPaths` is unported: there is no
`packages/actionview/src/view-paths.ts` for
`vendor/rails/actionview/lib/action_view/view_paths.rb`.

Until PR #5344 it scored 11/17 anyway, because the includer graph resolved
`ActionView::LookupContext`'s `include ViewPaths` (lookup*context.rb:230)
broadly and matched the surface against `lookup-context.ts`, which implements
the \_other* module — the nested `ActionView::LookupContext::ViewPaths`
(lookup_context.rb:125). Scoping the graph dropped it to 2/17.

The 9 newly-visible methods: `_prefixes`, `_view_paths`, `_view_paths=`,
`formats`, `formats=`, `locale`, `locale=`, `view_paths`, `view_paths=`.
Note the last six are `delegate ... to: :lookup_context` (view_paths.rb:11-12)
and the `_view_paths` pair goes through `ActionView::PathRegistry`
(already ported at `packages/actionview/src/path-registry.ts`).

## Acceptance criteria

- `packages/actionview/src/view-paths.ts` exists and carries
  `ActionView::ViewPaths`' surface, following the mixin convention in
  CLAUDE.md (this-typed functions / `include()`).
- `pnpm api:compare --package actionview` improves on `view_paths.rb`
  (baseline after #5344: 2/17).
