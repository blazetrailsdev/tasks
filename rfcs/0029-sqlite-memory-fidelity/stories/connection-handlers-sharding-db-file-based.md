---
title: "connection-handlers-sharding-db-file-based"
status: ready
updated: 2026-07-27
rfc: "0029-sqlite-memory-fidelity"
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

Audit finding from `audit-residual-memory-sites` (RFC 0029).

`connection_handlers_sharding_db_test.rb` uses `:memory:` at 6 lines
(`vendor/rails/activerecord/test/cases/connection_adapters/connection_handlers_sharding_db_test.rb:354,355,362,363,379,380`)
— all inside `connects_to` hashes in the shard-key/`default_shard` tests.
Everywhere else it names on-disk databases:
lines `33-34,67-70,111-114,171-174,288-289,317-318`
(`test/db/primary.sqlite3`, `test/db/primary_shard_one.sqlite3`) and, for the
data-separation tests, distinct `Tempfile` paths (`415-416`, `460-461`,
`518-519,523-524`).

trails' `packages/activerecord/src/connection-adapters/connection-handlers-sharding-db.test.ts`
hardcodes `":memory:"` at 22 sites (81, 82, 118-121, 171, 225-228, 274, 283,
307, 336, 360, 378, 397, 400, 415, 446, 503).

**Verdict: genuine over-use.** The sharding tests are precisely the ones where
distinct databases matter. Two glaring cases:

- `"sharding separation"` (trails ~line 503) gives both the `default` and `one`
  shards `":memory:"`; Rails gives them two distinct `Tempfile`s
  (`:415-416`). Same for `"same shards across clusters"` (trails ~446 vs Rails
  `:460-461`).
- Rails asserts `pool.db_config.database == "test/db/primary_shard_one.sqlite3"`
  (`:50-55`, `:84-99`); trails' equivalents assert only `db_config.name`, so
  the database-resolution half of the assertion is missing.

## Acceptance criteria

- [ ] Only the 6 sites matching Rails' 354/355/362/363/379/380 keep `":memory:"`.
- [ ] Config-hash tests use distinct on-disk paths mirroring
      `primary.sqlite3` / `primary_shard_one.sqlite3`.
- [ ] Data-separation tests (`same shards across clusters`, `sharding
  separation`) use distinct temp files per shard/cluster, mirroring Rails'
      `Tempfile` usage.
- [ ] Restore the `dbConfig.database` assertions Rails makes at `:50-55` and
      `:84-99` alongside the existing `dbConfig.name` ones.
- [ ] Test names unchanged; file cleanup is deterministic.
- [ ] May be split across two PRs (config-hash tests / tempfile tests) to stay
      under the 500-LOC ceiling — register the second via `tasks new`.
