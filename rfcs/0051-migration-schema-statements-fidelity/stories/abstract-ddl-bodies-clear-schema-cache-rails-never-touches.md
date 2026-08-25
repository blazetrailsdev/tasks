---
title: "Ten abstract DDL bodies clear the schema cache Rails never touches"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6169
claim: "2026-08-07T12:28:33Z"
assignee: "abstract-ddl-bodies-clear-schema-cache-rails-never-touches"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while working `pg-schema-statements-abstract-signature-divergences`
(PR #6164). Rails' `abstract/schema_statements.rb` never touches the schema
cache from a DDL method — there is no `schema_cache` reference anywhere in
`create_table`, `drop_table`, `add_column`, `remove_column`, `rename_column`,
`add_index`, `remove_index`, `change_column`, `rename_table` or
`change_column_default`. Cache invalidation in Rails happens through
`SchemaCache#clear_data_source_cache!` called by the _migration_ layer
(`migration.rb`'s `method_missing` → `connection.schema_cache.clear_data_source_cache!`
is not there either) — the cache is version-stamped and reloaded, not poked
per-DDL.

trails' abstract schema statements call
`await this.schemaCache.clearDataSourceCacheBang(...)` from ten methods:

- `schema-statements.ts:410` (createTable), `:479` (dropTable), `:492`
  (addColumn), `:508` (removeColumn), `:515` (renameColumn), `:526` (addIndex),
  `:563` (removeIndex), `:586` (changeColumn), `:626-627` (renameTable, both
  names), `:687` (changeColumnDefault), `:1023`.

PR #6164 removed the eleventh instance, in `renameIndex`, because Rails'
`rename_index` (`abstract/schema_statements.rb:980-990`) plainly does not have
it and the story called it out. The remaining ten are the same invention and
were not in that story's scope. `mysql/schema-statements.ts:134`,
`mysql2-adapter.ts:1390` and `postgresql-adapter.ts:3806/3878-3879/3938` carry
adapter-level copies of the same pattern.

Each call is also an `await` inside a body Rails runs synchronously, so it
changes the interleaving of a DDL method as well as the cache state.

## Converged shape

Delete the `clearDataSourceCacheBang` calls from the abstract DDL bodies (and
the adapter-level copies) so each body matches its Rails counterpart line for
line, and let invalidation happen where Rails puts it. Before deleting, check
which tests observe the clear — `schema-cache.test.ts` has several
`<method> clears schema cache entry before <DDL> SQL` cases. A test that pins
trails-only behaviour is the bug, not the licence to keep the call; but note
that in `renameIndex`'s case the corresponding test kept passing because
`addIndex`'s own clear covered it, so check whether each one is actually
observing the call it names.

This is likely too large for one PR — split by adapter layer (abstract first,
then the PG/MySQL copies) and file the rest as siblings from `main`.

## Acceptance criteria

- [ ] No `schemaCache.clearDataSourceCacheBang` call in
      `connection-adapters/abstract/schema-statements.ts`.
- [ ] Each affected body matches its `abstract/schema_statements.rb` counterpart.
- [ ] Tests that pinned the trails-only clear are deleted or re-pointed at the
      behaviour Rails actually has.
- [ ] All three adapter lanes green.
