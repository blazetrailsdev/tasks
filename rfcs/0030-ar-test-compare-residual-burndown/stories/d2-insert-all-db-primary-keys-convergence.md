---
title: "d2-insert-all-db-primary-keys-convergence"
status: claimed
updated: 2026-06-17
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 33
pr: null
claim: "2026-06-17T00:48:43Z"
assignee: "d2-insert-all-db-primary-keys-convergence"
blocked-by: null
---

## Context

Follow-up from d2-insert-all-unique-index-introspection (PR #3450). Rails
`InsertAll#primary_keys` (insert\*all.rb:61) is a single accessor =
`Array(model.schema_cache.primary_keys(table_name))` — the database primary
keys. It is consumed in three places:

- `returning` default (insert_all.rb:39)
- `readonly_columns` (insert_all.rb:198)
- `Builder#conflict_target` update branch (insert_all.rb:271)

In trails (`packages/activerecord/src/insert-all.ts`), `primaryKeys()` returns
the model's configured PK. PR #3450 added `dbPrimaryKeys()` (async,
schema_cache-backed) but wired it only into `findUniqueIndexFor`'s PK-fallback
comparison. The remaining two sites still use the configured PK:

- `returning` default (insert-all.ts ~101)
- `readonlyColumns()` (insert-all.ts ~456)

(The `conflictTarget` update branch is provably non-divergent: it is only
reachable when `uniqueBy` resolved to undefined, which requires configured PK ==
db PK, so the two are equal there.)

For an id-less table with a configured PK (e.g. Speedometer), Rails uses `[]`
at these sites; trails emits the configured column. This is latent — no current
test exercises insert/upsert RETURNING on such a table — but it is a real
divergence. The blocker is that `returning` is computed synchronously in the
constructor, so converging requires threading the async `dbPrimaryKeys()`
resolution (or a deferred returning computation) through `execute()`.

## Acceptance criteria

- [ ] `returning` default and `readonlyColumns()` consult the database primary
      keys (schema_cache), matching Rails `InsertAll#primary_keys`.
- [ ] A test covers insert_all/upsert_all on an id-less, configured-PK table
      (Speedometer-style) confirming no spurious RETURNING / readonly column.
- [ ] No regression for normal models (model PK == db PK).
