---
title: "Resolve per-file novel surface on mysql2 and libsql-replica adapters"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5947
claim: "2026-08-03T01:45:45Z"
assignee: "extra-surface-mysql2-and-libsql-per-file-singletons"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while closing `extra-surface-adapter-per-file-singletons` (PR #5918).
That story took the three adapter files named in its scope
(`abstract-mysql-adapter.ts`, `postgresql-adapter.ts`, `sqlite3-adapter.ts`) and
its sibling `extra-surface-adapter-cross-file-recurring-names` took the
cross-file recurring names. Nobody owns the per-file singletons on the two
remaining concrete adapter files, which `pnpm parity:api:extra --package activerecord
--json` still reports as novel:

- `connection-adapters/mysql2-adapter.ts` — `activeAsync`, `databaseTimezone`,
  `parseMysqlName` (plus `exec` / `executeMutation`, which belong to the
  cross-file story, not this one).
- `connection-adapters/libsql-replica-adapter.ts` — `syncReplica` (plus the
  `LibSQLReplicaAdapter` class name, which belongs to the driver-variant
  class-name story filed alongside this one).

Rails anchors to read first:
`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb`
(there is no `active_async`, no `database_timezone` reader — Rails reaches
`ActiveRecord.default_timezone` — and no name-parsing helper; MySQL name
splitting lives in `AbstractMysqlAdapter#extract_schema_qualified_name`,
abstract_mysql_adapter.rb). libsql has no Rails counterpart at all, so
`syncReplica` is a driver-only concept.

Reproduce with `pnpm parity:api && pnpm parity:api:extra --package activerecord --json`.

## Acceptance criteria

- One recorded decision per name above: delete (dead), rename toward the Rails
  name, make Rails-private (`_` prefix) or TS `private`/`protected`, or a
  `@noRailsEquivalent PERMANENT|CONVERGEABLE <reason>` JSDoc tag whose reason is
  anchored to a vendored Rails `file:line`. Deletion of dead surface is
  preferred over a tag — PR #5918 deleted seven members that way.
- Justifications live at the declaration site, not only in the PR body.
- Novel counts for `mysql2-adapter.ts` and `libsql-replica-adapter.ts` drop to
  the residue owned by other stories (`exec` / `executeMutation` / the class
  name); `pnpm parity:api:extra` reports no STALE entries.
- Scoped `pnpm vitest run` on the touched adapter test files passes. The MySQL
  lane needs a running server; if unavailable locally, say so and let CI verify.
- Record per-file novel before/after in the PR body.
