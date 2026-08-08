---
title: "One in-memory database predicate: tasks' URI parse vs SQLite3Adapter's substring check"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6235
claim: "2026-08-08T14:02:06Z"
assignee: "sqlite-in-memory-predicate-disagrees-with-adapter"
blocked-by: null
closed-reason: null
---

## Context

Two SQLite in-memory predicates disagree in trails:

- `isInMemoryDatabase` in
  `packages/activerecord/src/tasks/sqlite-database-tasks.ts` parses the URI per
  [the SQLite URI spec](https://www.sqlite.org/inmemorydb.html) — `:memory:`, `file::memory:...`, and
  a `file:...?...mode=memory` query parsed with `URLSearchParams`.
- `SQLite3Adapter` uses a broader substring check, so a path that merely
  _contains_ the text `mode=memory` is classified as in-memory.

The file's own comment has flagged aligning them as a follow-up since the
helper was introduced; PR #6232 removed `withOperationAdapter` around it but
left both predicates in place. Neither has a Rails counterpart — Rails' SQLite
tasks never ask the question (`tasks/sqlite_database_tasks.rb` operates on
`db_config.database` directly and shells out) — so this is trails-only surface
that should at minimum agree with itself, and ideally exist once.

## Converged shape

One predicate, the URI-accurate one, used by both the tasks class and
`SQLite3Adapter`; the substring check deleted. If the single remaining helper
still has no Rails counterpart it carries a `@noRailsEquivalent` reason naming
the sqlite3-mem lane it serves.

## Acceptance criteria

- `SQLite3Adapter` and `SQLiteDatabaseTasks` classify in-memory database names
  identically, through one implementation.
- A path containing the literal text `mode=memory` outside the query string is
  not treated as in-memory by either.
- Green on the sqlite file lane and `sqlite3_mem`.
