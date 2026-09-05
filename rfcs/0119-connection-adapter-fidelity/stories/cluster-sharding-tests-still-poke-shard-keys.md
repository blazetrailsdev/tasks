---
title: "same shards across clusters and sharding separation still poke _shardKeys by hand"
status: done
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7530
claim: "2026-09-05T19:06:48Z"
assignee: "io-set-encoding-cannot-hold-mri-null-external-encoding"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #7277 (RFC 0119 `sharding-db-tests-use-connects-to-not-handler-direct`),
which converted four tests in
`packages/activerecord/src/connection-adapters/connection-handlers-sharding-db.test.ts`
onto `Base.configurations(...)` + `Base.connectsTo({ shards: ... })` and deleted
their hand-poked `(Base as any)._shardKeys = [...]` assignments.

Two tests in the same file were out of that story's scope and still build their
pools by calling `Base.connectionHandler.establishConnection(new HashConfig(...))`
directly and then poking `_shardKeys` by hand:

- `same shards across clusters` — `(SecondaryBase as any)._shardKeys = ["one"]`
  and `(SomeOtherBase as any)._shardKeys = ["one"]`.
- `sharding separation` — `(SecondaryBase as any)._shardKeys = ["default", "one"]`.

Their Rails counterparts are
`vendor/rails/activerecord/test/cases/connection_adapters/connection_handlers_sharding_db_test.rb`
(`class SecondaryBase < ActiveRecord::Base` onward, rb:338+), which build from a
`configurations` hash plus `connects_to(shards: {...})` like every other test in
that file.

The hand-poking is the tell that the handler-direct path skips `connects_to`'s
shard-key registration, so these two tests are not exercising the code path
Rails exercises — the same defect #7277 fixed for the other four.

## Converged shape

Build both tests' pools through `Base.configurations(...)` +
`connectsTo({ shards: ... })` on the relevant abstract base classes, via the
file's existing `withBaseConfigs` helper, and delete every
`(X as any)._shardKeys = [...]` assignment: the shard keys come from
`connectsTo`.

Note `sharding-separation-tests-use-model-api-not-raw-sql` (same RFC) also
touches `sharding separation`, for a different reason (raw SQL vs the model
API). Check whether it has landed and sequence accordingly — the two should not
collide in the same file.

## Acceptance criteria

- [ ] `same shards across clusters` and `sharding separation` build pools via
      `configurations` + `connectsTo`, mirroring their Rails counterparts.
- [ ] No `_shardKeys` assignment remains anywhere in the file.
- [ ] Test names unchanged.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
