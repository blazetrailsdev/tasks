---
title: "converge-sidecar-pool-rides-canonical-schema"
status: draft
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps:
  - create-table-canonical-schema-loader
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

RFC 0059 (drop-defineschema-mirror-create-table). **Guiding principle: Rails
fidelity above all else.** Follow-up surfaced while converting the relation
tests (PR #4452, `convert-bespoke-defineschema-relation`).

Rails has exactly ONE test database: `schema.rb` is loaded once
(`ActiveRecord::Schema.define` via `maintain_test_schema!` / `db:test:prepare`)
and every connection in the single pool sees the full canonical schema. Tests
never `create_table` a canonical table.

trails has an extra construct — the **sidecar test pool** (`_pool` in
`packages/activerecord/src/test-adapter.ts`, leased via `createTestAdapter()` /
`createSidecarTestAdapter()` / `createPooledTestAdapter()`), used by
pool-lifecycle and raw-adapter suites that need a leased connection independent
of the fixtures machinery. Its sqlite DB is resolved by `_pooledSqliteDatabase()`
(`test-adapter.ts:75-83`):

```text
AR_TEST_WORKER_DB ?? `file:trails_test_${workerId}?mode=memory&cache=shared`
```

while the **primary** `Base.connection` DB is
(`test-helpers/test-database-config.ts:39`):

```text
AR_TEST_WORKER_DB ?? ":memory:"
```

Consequences:

- **Template-clone mode** (`AR_TEST_WORKER_DB` set — the sqlite CI lane /
  multi-worker): both resolve to the SAME on-disk file, which
  `loadCanonicalSchema` stamped at boot (`template-global-setup.ts:54`). The
  sidecar already carries the full canonical schema — Rails-faithful.
- **`:memory:` fallback** (single-worker / local dev): the primary is an
  anonymous private `:memory:` DB (schema loaded onto it by
  `test-setup-dy.ts`'s `loadSchema`), whereas the sidecar is a DIFFERENT
  shared-cache named memory DB (`file:trails_test_N?mode=memory&cache=shared`)
  that NOTHING runs `loadCanonicalSchema` against. So in this path the sidecar
  is schema-less.

That schema-less fallback is exactly why `relation.trails.test.ts`'s
`isBlank / isPresent` suite (which stubs `AR_NO_AUTO_SCHEMA` and drives a
sidecar-leased connection) must `createTable("developers", { force: true }, …)`
in-test — a bespoke create that would not exist if the sidecar rode the
canonical schema like Rails. PR #4452 kept the explicit create (mirroring
schema.rb `create_table :developers`, dropped by name in `afterAll`) because
converging the pool wiring is out of scope for a per-file test conversion.

## Acceptance criteria

- The sidecar test pool rides the boot-laid canonical schema in ALL sqlite
  configs, not just template-clone mode. Options to evaluate:
  - Make the `:memory:` fallback resolve the sidecar `_pool` DB to the SAME
    handle as the primary `Base.connection` (`test-database-config.ts:39`), so
    it inherits the schema `test-setup-dy.ts` loads; or
  - Run `loadCanonicalSchema` on the `_pool` at boot in the `:memory:` fallback
    path (`_establishPooledTestPool`, `test-adapter.ts:116-189`).
  - Pick whichever keeps the PG/MySQL URL-DB paths (which already share one
    server DB) unaffected.
- `relation.trails.test.ts`'s `isBlank / isPresent` suite drops its in-test
  `createTable("developers")` + `dropTable("developers")` and rides the
  canonical `developers` table (and its `AR_NO_AUTO_SCHEMA` stub is revisited —
  keep only if still needed).
- Audit other sidecar-pool suites (`createTestAdapter` / `createSidecarTestAdapter`
  / `createPooledTestAdapter` callers) for the same schema-less-fallback
  workaround and remove bespoke canonical `create_table`s that become
  unnecessary.
- No regressions in the sqlite `:memory:` single-worker local run or the
  template-clone CI lane; PG/MySQL lanes unaffected. `test:compare` delta >= 0.
- No test renames. No `node:*` imports, no `process.*` in test bodies (infra
  files may read env via the existing `getEnv` helper). Single PR from main,
  under 500 LOC.
