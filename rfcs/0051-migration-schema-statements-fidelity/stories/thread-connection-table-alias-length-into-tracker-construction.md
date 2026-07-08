---
title: "thread-connection-table-alias-length-into-tracker-construction"
status: ready
updated: 2026-07-08
rfc: "0051-migration-schema-statements-fidelity"
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

`AliasTracker.create` (`packages/activerecord/src/associations/alias-tracker.ts`)
mirrors Rails' `pool.with_connection { |c| new(c.table_alias_length, aliases) }`
(`vendor/rails/activerecord/lib/active_record/associations/alias_tracker.rb:9-25`),
so the tracker's alias cap should be the **connection's** `table_alias_length`
(256 on MySQL, `mysql/schema_statements.rb:135`; 63 on PostgreSQL).

PR #4795 added the MySQL 256 override and made `create` honor a connection-like
arg's `tableAliasLength`, but two tracker **construction sites still hardcode the
default** (64) instead of threading the connection's value:

- `packages/activerecord/src/associations/join-dependency.ts:182,669` —
  `new AliasTracker(undefined, ...)` → always `DEFAULT_TABLE_ALIAS_LENGTH` (64).
- `packages/activerecord/src/associations/association-scope.ts:277` —
  `AliasTracker.create(null, ...)` passes `null`, never a connection.

Rails always enters `pool.with_connection`, so on MySQL these paths should cap
aliases at 256 (and 63 on PG), not 64. trails' `withConnection` is async while
`create`/JoinDependency construction is synchronous — so the fix must thread a
resolved connection (or its `tableAliasLength`) down to these sites.

Codex flagged this on PR #4795 (`alias-tracker.ts:39`).

## Acceptance criteria

- [ ] `JoinDependency` seeds its `AliasTracker` with the base model's
      `connection.tableAliasLength()` (not the hardcoded 64), so a MySQL join
      chain truncates aliases at 256. Test with a MySQL(-stub) connection.
- [ ] `AssociationScope#scope` threads the connection's `tableAliasLength`
      into `AliasTracker.create` instead of passing `null`.
- [ ] Non-MySQL adapters keep their real cap (PG 63, sqlite 64).
- [ ] No async ripple that breaks the synchronous tracker-construction callers
      (resolve the length up front, don't make construction async unless the
      call sites already are).
