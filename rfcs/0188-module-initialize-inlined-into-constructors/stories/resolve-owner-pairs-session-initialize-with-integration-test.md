---
title: "parity: resolveOwner pairs Integration::Session#initialize with the IntegrationTest constructor"
status: draft
updated: 2026-10-15
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8919 made compare.ts write `inlined-from-pairs.json`. That file shows the IntegrationTest constructor (`packages/actionpack/src/action-dispatch/testing/integration.ts`) paired by `resolveOwner` (`scripts/api-compare/compare.ts`, `inlinedSegmentsFor`) with two Rails classes: `ActionDispatch::Integration::Session` and `ActionDispatch::IntegrationTest`. Rails defines `Integration::Session#initialize` in `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb`. Its TS counterpart is the `Session` class, not `IntegrationTest`, so the call gates compare the IntegrationTest constructor against Session's `initialize` chain as well. `lint-inlined-from.ts` currently copes by preferring the same-named pair.

## Acceptance criteria

- `resolveOwner` pairs `Integration::Session#initialize` with the TS `Session` constructor, or with nothing; never with `IntegrationTest`.
- `inlined-from-pairs.json` holds one pair per tagged constructor; the gate's multi-pair arm can then be removed.
- `pnpm parity:api:calls` / `:calls:args` row movement is stated and explained.
