---
title: "converge-no-database-error-to-connect-site"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5883
claim: "2026-08-02T13:07:13Z"
assignee: "converge-no-database-error-to-connect-site"
blocked-by: null
closed-reason: null
---

## Context

Found by the `@noRailsEquivalent` tag audit (RFC 0080). `isNoDatabaseError` is
tagged on three adapters:

- `connection-adapters/abstract-adapter.ts:767` (base, returns false)
- `connection-adapters/postgresql-adapter.ts:2764`
- `connection-adapters/sqlite3-adapter.ts:210`

Rails has no such predicate. It recognizes the condition inline at the connect
site and raises the typed error there — `postgresql_adapter.rb:63`,
`sqlite3_adapter.rb:38` and `:120` — and `DatabaseTasks` simply rescues
`ActiveRecord::NoDatabaseError` (`tasks/database_tasks.rb:214`). Rails never
classifies a raw driver error after the fact.

The predicate exists only to serve `DatabaseTasks._isMissingDatabaseError`
(`tasks/database-tasks.ts`), which is itself the deviation: it classifies an
already-raised raw driver error instead of rescuing the typed one. Converge
both sides and the predicate disappears — it is unfinished porting, not a
language fact.

## Acceptance criteria

- Each adapter raises `NoDatabaseError` at its own connect site, matching the
  Rails line references above.
- `DatabaseTasks._isMissingDatabaseError` rescues the typed `NoDatabaseError`
  rather than sniffing a driver error, matching `database_tasks.rb:214`.
- `isNoDatabaseError` and its `@noRailsEquivalent` tag are deleted from all
  three adapters.
- Ported `database_tasks` tests still pass; no test name is renamed.
