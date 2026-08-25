---
title: "Every STI subclass should own its columns memo (drop the ownsColumnMemo carve-out)"
status: closed
updated: 2026-07-24
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Fully subsumed by PR #5199 (removed the STI schema-host redirect): every class now owns its columns memo — the ownsColumnMemo/columnMemo/invalidateStiDescendantColumnMemos carve-out this story targeted is deleted, so there is no base-owns/subclass-inherits boundary left to converge."
---

## Context

Follow-up to #5178. Rails gives every class its own `@columns_hash` / `@columns`:
`inherited` calls `child_class.reload_schema_from_cache(false)` and nils
`@ignored_columns` (`vendor/rails/activerecord/lib/active_record/model_schema.rb:574-580`),
and `load_schema!` re-reads `schema_cache.columns_hash(table_name)` minus that
class's own `ignored_columns` (`:587-594`); `columns_hash` / `columns` are plain
per-class memos (`:427-434`). Ruby classes inherit no ivars, so Rails has NO
base-owns / subclass-inherits split — trails' shared memo on the STI base (the
schema-host redirect) is an invention.

PR #5178 converged the worst symptom (an STI subclass with its own
`ignoredColumns` recomputed the filtered hash on every `columnsHash()` /
`columns()` call) by giving that subset a per-class memo, gated by a new
`ownsColumnMemo(host)` predicate in
`packages/activerecord/src/model-schema.ts`. That predicate names the boundary
of the deviation and should not survive.

Measured cost of full convergence: flipping `ownsColumnMemo` to plain
`isStiSubclass(host)` — every STI subclass owns its memo, as in Rails — leaves
354 tests passing across base / base.trails / inheritance / model-schema-load /
model-schema-sync-load / model-schema-columnshash-recovery / attributes, and
breaks exactly one assertion pair:
`packages/activerecord/src/model-schema-sync-load.test.ts:261-280`, which
asserts `hasOwnProperty(Circle, "_columnsHash") === false` and the same for
`_columns` — i.e. the deviation is enshrined in a trails-side test. Deciding
whether that invariant goes (and what replaces it) is the substance of this
story.

Out of scope: the deeper sharing of `_attributeDefinitions` / `_schemaLoaded` /
`_attributesBuilder` on the STI base. Only the columns memos move here.

## Acceptance criteria

- `ownsColumnMemo` is deleted; every STI subclass memoizes its own
  `_columnsHash` / `_columns`, matching Rails' per-class ivars.
- `model-schema-sync-load.test.ts:261-280`'s shared-memo assertion is replaced
  by one expressing the Rails invariant (the subclass's own memo holds the
  base-table columns filtered by the subclass's own `ignoredColumns`, and is
  rebuilt — not stale — after the base re-reflects).
- `invalidateStiDescendantColumnMemos` still clears every same-table
  descendant on base re-reflection; existing STI ignoredColumns regression tests
  in base.trails.test.ts and base.test.ts pass unchanged.
- The deviation JSDoc on `ownsColumnMemo` goes with it.
