---
title: "STI subclass with own ignoredColumns bypasses columns/columnsHash memos — Rails keeps per-class @columns_hash"
status: in-progress
updated: 2026-07-23
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5178
claim: "2026-07-23T21:22:09Z"
assignee: "sti-subclass-own-ignoredcolumns-unmemoized-read-time"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #5140. Rails keeps `@columns_hash`/`@columns`/`@column_names` as
per-class ivars, each class's `load_schema!` filtering with that class's own
`ignored_columns` (`vendor/rails/activerecord/lib/active_record/model_schema.rb:427-433,587-594`;
subclass inheritance at `:331-332,574-580`). trails memoizes `_columnsHash`
(`applyColumnsHash`, `packages/activerecord/src/model-schema.ts`) and `_columns`
(`columns()`) on the STI BASE, so an STI subclass with its OWN `ignoredColumns`
is special-cased: `columnsHash()` and `columns()` skip the memo and recompute
read-time filtered on every call (guards
`isStiSubclass(this) && hasOwnProperty(this, "_ignoredColumns")` in
`columnsHash()` and `columns()`, model-schema.ts). Correct but unmemoized and
un-Rails-shaped; regression coverage: base.trails.test.ts "an STI subclass's own
ignoredColumns does not read the base's columns memo".

Blocking concern: per-class own-property memos on subclasses go stale when the
base is reset, because `resetColumnInformation`'s base path does not clear
descendants' own cache props (only `_schemaRevision` stamps the overlays);
`reloadSchemaFromCache` (same file) already deletes descendants' own props and
is the pattern to reuse.

## Acceptance criteria

- STI subclass with its own `ignoredColumns` memoizes `_columnsHash`/`_columns`
  per class (Rails per-class ivars), with the base-reset path invalidating
  descendants' own memos (mirroring `reload_schema_from_cache` recursion).
- The read-time recompute guards in `columnsHash()`/`columns()` are deleted.
- base.trails.test.ts STI regression test and base.test.ts ignored-columns
  tests unchanged and passing.
