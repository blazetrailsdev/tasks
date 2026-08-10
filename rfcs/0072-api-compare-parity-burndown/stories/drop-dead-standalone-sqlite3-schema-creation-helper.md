---
title: "Drop the dead standalone sqlite3 schemaCreation helper"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5945
claim: "2026-08-03T01:35:45Z"
assignee: "drop-dead-standalone-sqlite3-schema-creation-helper"
blocked-by: null
closed-reason: null
---

## Context

`schemaCreation` in
`packages/activerecord/src/connection-adapters/sqlite3/schema-statements.ts:201`
has no production caller. The live path is the adapter's own getter,
`SQLite3Adapter#schemaCreation` (`connection-adapters/sqlite3-adapter.ts:203`),
which mirrors Rails' `SQLite3::SchemaStatements#schema_creation`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/schema_statements.rb`).
The standalone module function is a second spelling of the same method that only
its own test (`sqlite3/schema-statements.test.ts:22`) invokes.

PR #5938 re-typed it as `function schemaCreation(this: SchemaQuoter)` so it
keeps Rails' zero-arg shape after the adapter became required, but that only
made a dead duplicate faithful rather than removing it.

Check before deleting: `parity:api` may be matching `schema_creation` through
this standalone function rather than through the adapter getter, in which case
removing it must not lose the match (the getter should pick it up — verify with
`pnpm parity:api` on the activerecord slice before and after).

## Acceptance criteria

- The standalone `schemaCreation` export is deleted, or a production caller is
  established for it.
- Its test is deleted or retargeted at the adapter getter.
- `parity:api` still matches `schema_creation`; activerecord method coverage
  and novel counts do not regress.
