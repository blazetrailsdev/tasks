---
title: "long-tail-memory-sites-ambient"
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

Long-tail `:memory:` sites whose Rails counterpart uses the ambient
file-backed connection:

- `adapter-prevent-writes.test.ts:15` — Rails `adapter_prevent_writes_test.rb:13`
  (`@connection = ActiveRecord::Base.lease_connection`).
- `database-statements.test.ts:8` — Rails `database_statements_test.rb:7`
  (same ambient pattern).
- `unconnected.test.ts:13` — Rails `unconnected_test.rb:12,21` leases the
  ambient connection and re-establishes it by **name**, never naming a database.
- `multi-db-migrator.test.ts:13` — Rails `multi_db_migrator_test.rb:24-25` takes
  `ActiveRecord::Base.connection_pool` and `ARUnit2Model.connection_pool`;
  trails builds a fresh `new BetterSQLite3Adapter(":memory:")`.
- `associations.test.ts:1026` — the `AnimalsBase.connectsTo` config; Rails'
  animals/`arunit2` connection is file-backed.
- `shard-selector.test.ts:12` — the `HashConfig` used to set up shards; Rails'
  shard-selector middleware test resolves shards from the ambient configs.

## Acceptance criteria

- [ ] Each listed site derives from the ambient file-backed test config (or an
      explicit on-disk path where distinct databases are the point, as in
      `multi-db-migrator` and `associations`' second pool) instead of
      `":memory:"`.
- [ ] Test names unchanged.
- [ ] Comment-only `:memory:` mentions in `multiple-db.test.ts:152`,
      `transaction-instrumentation.test.ts:391`, `adapter.test.ts:391`,
      `insert-all.test.ts:492` and `scoping/default-scoping.test.ts:993` are
      **not** code sites — leave them (they document Rails' `in_memory_db?`
      gates correctly). `multiple-db.test.ts:150-152` describes a second pool
      that no longer hardcodes `:memory:`; verify the comment still reads true
      and correct it if not.
- [ ] Split across PRs if over 500 LOC.
