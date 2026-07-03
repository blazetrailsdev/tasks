---
title: "Converge shared transactional-fixture helpers off sidecar _pool onto Base.connection"
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

RFC 0059 follow-up (see `converge-sidecar-pool-rides-canonical-schema`,
PR #4463). The hardest batch: shared test-helper modules that themselves lease
from the standing sidecar `_pool` and thus fan the sidecar out to every suite
that uses them. They call `createTestAdapter` / `createSidecarTestAdapter`
(`packages/activerecord/src/test-adapter.ts:220`, `:251`) on the divergent
`_pooledSqliteDatabase()` handle (`:75`) instead of `Base.connection`.

Helper modules + their self-tests:

- `test-helpers/use-handler-transactional-fixtures.ts`
- `test-helpers/with-transactional-fixtures.ts`
- `encryption/test-helpers.ts`
- `test-helpers/with-transactional-fixtures.test.ts` (self-test)
- `test-helpers/define-schema.test.ts` (self-test)

Rails wires transactional fixtures off the primary pool
(`Base.connection_handler.connection_pool_list(:writing)` →
`pool.pin_connection!` → `pool.lease_connection`); see
`vendor/rails/activerecord/test/cases/connection_pool_test.rb:16-30` for the
in-test-pool pattern and Rails' `TestFixtures` module for the pin lifecycle.

## Acceptance criteria

- The helper modules resolve their adapter from `Base.connection` /
  `Base.connection_pool` (the primary, schema-loaded pool), not the sidecar.
- Self-tests updated to match; no test renames.
- `test:compare` delta >= 0; all lanes unaffected.
- 500 LOC ceiling; single PR from main; no stacked PRs.
- This batch unblocks the final `retire-sidecar-pool-rework-pool-mechanics`
  helper deletion (it removes the last `_pool` leases).
