---
title: "database-exists-predicate-still-is-prefixed"
status: done
updated: 2026-07-31
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5752
claim: "2026-07-31T20:34:27Z"
assignee: "database-exists-predicate-still-is-prefixed"
blocked-by: null
closed-reason: null
---

## Context

PR #5736 gave every `*_exists?` predicate a single TS spelling
(`columnExists`, `indexExists`, `foreignKeyExists`, `checkConstraintExists`,
`viewExists`, `dataSourceExists`, `virtualTableExists`) across receivers.
One straggler could not be converged there: `AbstractAdapter#isDatabaseExists`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1970`),
which ports `database_exists?`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:362`
— zero-arg instance predicate returning `!!@raw_connection`).

Renaming it to `databaseExists` collides with a trails invention:
`PostgreSQLAdapter#databaseExists(name: string)`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:3781`,
delegating to
`connection-adapters/postgresql/schema-statements-class.ts:568`), a one-arg
async "does this named database exist" query with no Rails counterpart —
Rails PG only has `self.database_exists?(config)`
(`postgresql_adapter.rb`) and the inherited zero-arg instance predicate.
The clashing signature makes `PostgreSQLAdapter` unassignable to
`AbstractAdapter` (`tasks/postgresql-database-tasks.ts:233`,
`packages/trailties/src/database.ts:501`).

## Acceptance criteria

- [ ] `PostgreSQLAdapter#databaseExists(name)` is reconciled with Rails —
      either renamed to a non-`database_exists?` name (it is a
      `SELECT 1 FROM pg_database` probe, not the connection-liveness
      predicate) or moved to a static `databaseExists(config)` matching
      `self.database_exists?`.
- [ ] `AbstractAdapter#isDatabaseExists` is renamed to `databaseExists`, so
      no `*_exists?` predicate keeps the `is` prefix.
- [ ] Call sites (`tasks/postgresql-database-tasks.ts`,
      `packages/trailties/src/database.ts`) updated; parity:api surface
      unchanged or improved.
- [ ] Green on all three lanes.
