---
title: "Retire the synthesized columns_hash fallback (columns_hash is a pure DB read in Rails)"
status: ready
updated: 2026-08-26
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `columns_hash` is a pure DB read — `load_schema!` sets
`@columns_hash = schema_cache.columns_hash(table_name).except(*ignored_columns)`
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:587-597`) and
`column_names` is `columns.map(&:name)` (:437-441). A model with no table simply
has no columns; a declared-but-columnless `attribute()` never appears.

trails additionally **synthesizes** a `columns_hash` from declared attributes, in
two places in `packages/activerecord/src/model-schema.ts`:

- `columnsHash()` — the fallback after the schema-cache probe misses, building
  each entry with `synthesizedColumn(name, declared.getAttribute(name))`.
- `loadSchemaBangAnchor()` — the cache-miss path, which sets `_columnsHash` from
  `declaredAttributes(this)` and then stamps `_schemaLoaded`.

This exists because trails' schema reflection is async while Rails'
`load_schema!` blocks, so a synchronous `columnNames()` on a cold model has
nothing to read. It is the root cause of the machinery RFC 0115's
`retire-virtual-attribute-reconciliation` (PR #7091) removed: a synthesized
`columns_hash` cannot tell a declared attribute from a real column, which is why
a `virtual` flag had to exist to re-separate them.

It is still load-bearing and still divergent. Live consequences today:

- `loadSchemaBangAnchor` stamps `_schemaLoaded` on a view built from
  declarations, so a model that reflected cold serves that view until its next
  `loadSchema` re-reflects (PR #7091 verified `applyColumnsHash` overwrites it,
  but only on that model's own next load).
- `column-names-sync-virtual-exclusion.trails.test.ts` exists solely to pin the
  sync/async boundary this creates.
- The `pkStillMissing` branch in the same function is another arm of it.

## Converged shape

`columns_hash` becomes DB-sourced only, as in `model_schema.rb:587-597`, and a
table-less attribute-only model has an empty `columns_hash` the way a Rails model
with no table does. That requires deciding what a synchronous `columnNames()` on
an unreflected model returns — the honest options are an empty list, or raising
the way `load_schema!` raises `TableNotSpecified` (:587-590) — rather than
inventing columns.

Depends on the schema cache being warm at boot (RFC 0031), which is already the
normal path; the synthesized branch is reached only when it is cold.

## Acceptance criteria

- [ ] Neither `columnsHash()` nor `loadSchemaBangAnchor()` builds a column from a
      declared attribute; `synthesizedColumn` is gone.
- [ ] `_schemaLoaded` is only ever stamped on a DB-sourced reflection.
- [ ] The sync/async boundary tests are updated to the chosen semantics, or
      retired with the fallback.
- [ ] activerecord suites green on all adapter lanes; parity deltas non-negative;
      `pnpm parity:api:calls` / `:args` clean.
