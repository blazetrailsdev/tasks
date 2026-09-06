---
title: "A rolled-back DDL leaves its reflected columns in the schema cache"
status: done
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7543
claim: "2026-09-05T23:06:51Z"
assignee: "converge-hash-config-configuration-alias"
blocked-by: null
closed-reason: null
---

## Context

Surfaced debugging a PostgreSQL red on PR #7469 — the failure was pre-existing
and latent, not caused by that PR.

A DDL statement run inside a test is rolled back with the fixture transaction,
but the column information it caused trails to reflect is NOT: it stays in the
adapter's `internalSchemaCache`, keyed by table, and every later model that
loads that table reads it (`loadSchemaFromCacheSync`,
`packages/activerecord/src/model-schema.ts:694-710`).

Reproduced against a real postgres:17 with
`packages/activerecord/src/adapters/postgresql/array.test.ts`:

- `it("change column default with array")` runs
  `changeColumnDefault("pg_arrays", "tags", [])`. The emitted SQL is correct —
  `ALTER COLUMN "tags" SET DEFAULT '{}'` — and the test's own
  `resetColumnInformation` caches the reflected default `[]`.
- The transaction rolls back. `information_schema.columns` shows
  `tags.column_default` back to `null`.
- Every later test in the file reads `tags`' default as `[]`.

Rails cannot hit this: `array_test.rb:14-29` recreates `pg_arrays` in `setup`, so
each test reflects fresh schema. trails' file builds the table in `beforeAll`.

The consequence had been invisible because `Type::Value#changed?` compared by
reference, so a `[]` default never matched an assigned `[]` and the column was
always written. Once #7469 made that comparison Ruby value equality
(`value.rb:84-86`), the column became correctly-unchanged and was omitted from
the INSERT, and PG stored NULL against the real (NULL) default —
`test_assigning_non_array_value` and `test_assigning_empty_string` failed with
`expected null to deeply equal []`.

PR #7469 fixed that one file by dropping the table's cache entry per test, which is
Rails' own `schema_cache.clear_data_source_cache!(table_name)`
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:526`). This story is
the general case: any test file that mutates schema inside a transaction and
builds its table in `beforeAll` carries the same trap, silently, until some
unrelated correctness fix makes it observable.

Note `resetColumnInformation` itself is fine — it calls
`clearDataSourceCacheBang` (`connection-adapters/schema-cache.ts:349-355`), which
does delete the columns hash. It clears its own receiver `tableName`, so calling
it on a model whose table is not the mutated one is a silent no-op.

## Acceptance criteria

- [ ] Audit `packages/activerecord/src/**` for test files that run DDL inside a
      transactional-fixture test while creating their table in `beforeAll`;
      enumerate them in the story before fixing.
- [ ] Each either recreates its table per test the way its Rails counterpart's
      `setup` does, or drops the table's schema-cache entry per test.
- [ ] Consider whether the rollback path itself should invalidate the cached
      columns hash for tables the transaction issued DDL against, which would
      make the per-file fix unnecessary — decide and record which route is
      Rails-faithful.
- [ ] The PG and MySQL lanes stay green.
