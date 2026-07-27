---
title: "Decide the module-level config accessor shape and pilot it"
status: in-progress
updated: 2026-07-27
rfc: "0081-writer-accessor-convergence"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 280
priority: 3
pr: 5391
claim: "2026-07-27T02:05:10Z"
assignee: "module-level-config-accessor-shape"
blocked-by: null
closed-reason: null
---

## Context

Shape 2 of the RFC, and the only shape with a real technical constraint behind
it. `packages/activerecord/src/ar-config.ts` declares 23 module-level
`export let` config bindings; ESM live bindings are read-only for importers, so
each needs a `setX` function today (e.g. `ar-config.ts:201-205`,
`maintainTestSchema` / `setMaintainTestSchema`). 21 of them map to a Ruby
`foo=`, plus `setQueryTransformers` in `query-transformers.ts`.

Rails spells these as attributes on the `ActiveRecord` module —
`ActiveRecord.maintain_test_schema = true`,
`ActiveRecord.async_query_executor = ...` — so the convergent TS form is a
module object exposing `get` / `set` accessors, letting call sites write
`ActiveRecord.maintainTestSchema = true`. That is both the convention-compliant
shape and closer to Rails than the current bindings.

This story is the DESIGN decision plus a pilot conversion, not the full sweep:
the shape has to be settled before 21 conversions are worth doing (how the
module object relates to the existing exported bindings, whether the old
bindings stay as deprecated readers during transition, and what the import
surface looks like for internal callers).

## Acceptance criteria

- A written decision in the RFC on the module-object shape, including what
  happens to the existing `export let` readers and their internal callers.
- Pilot: 2-3 representative bindings converted end to end (suggest
  `maintainTestSchema`, `asyncQueryExecutor`, `queues`) with call sites updated
  to assignment.
- `pnpm api:compare` matches those Ruby `foo=` writers; `pnpm api:extra` shows
  the matching drop with no stale entries.
- The remaining bindings are registered as follow-up stories sized under the
  500-LOC ceiling — do NOT convert all 21 in this PR.
