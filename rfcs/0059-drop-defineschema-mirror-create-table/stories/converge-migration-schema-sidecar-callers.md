---
title: "Converge migration/schema/dumper suites off sidecar _pool onto Base.connection"
status: ready
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 follow-up. The parent story
`converge-sidecar-pool-rides-canonical-schema` (PR #4463, done) split the
sidecar-`_pool` caller convergence into per-area batches; batches (PRs 4500 and 4501) converged only the enumerated association / attribute-method / relation
suites. The migration/schema-introspection suites were NOT in those batches
and still lease from the standing sidecar `_pool`
(`packages/activerecord/src/test-adapter.ts:220 createTestAdapter`,
`:251 createSidecarTestAdapter`, backed by `_establishPooledTestPool` at
`:116` on the divergent `_pooledSqliteDatabase()` handle at `:75`).

Rails has no sidecar test pool — every test uses `Base.connection`; a test
that needs its own pool builds one in-test from the primary config
(`vendor/rails/activerecord/test/cases/connection_pool_test.rb:16-30`).

Files still calling `createTestAdapter` / `createSidecarTestAdapter` in this
area:

- `migration.test.ts`, `migration.trails.test.ts`
- `migrator.test.ts`, `migrator.trails.test.ts`
- `schema-dumper.test.ts`, `schema-dumper.trails.test.ts`
- `schema-introspection.trails.test.ts`
- `active-record-schema.test.ts`

Read the corresponding Rails test for each suite first (fidelity above all).

## Acceptance criteria

- Every listed file rides `Base.connection` (the primary, schema-loaded pool)
  instead of a sidecar-leased adapter, exactly as its Rails counterpart does.
- Drop any now-unnecessary in-test `createTable`/`dropTable` workaround that
  existed only because the sidecar's `:memory:` fallback had no schema.
- No test renames; `test:compare` delta >= 0; all lanes unaffected.
- 500 LOC ceiling; single PR from main; no stacked PRs.
