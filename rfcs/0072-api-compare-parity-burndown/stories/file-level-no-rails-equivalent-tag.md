---
title: "file-level-no-rails-equivalent-tag"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5950
claim: "2026-08-03T02:05:48Z"
assignee: "file-level-no-rails-equivalent-tag"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while closing `extra-surface-adapter-class-names` (PR #5927). That PR
tagged six SQLite driver-variant adapter files
(`connection-adapters/better-sqlite3-adapter.ts`, `expo-sqlite-adapter.ts`,
`libsql-adapter.ts`, `libsql-remote-adapter.ts`, `libsql-replica-adapter.ts`,
`node-sqlite-adapter.ts`) with the SAME eight-line `@noRailsEquivalent
PERMANENT` reason, because Ruby binds one SQLite gem (sqlite3_adapter.rb:14)
and declares one `SQLite3Adapter` (sqlite3_adapter.rb:30). ~50 of that PR's 66
added lines were that duplicated reason. Other whole-file cases sit in the same
position: `sqlite/libsql.ts` (11 novel), `connection-adapters/abstract/temporal-wire.ts`
(10 novel), `connection-adapters/abstract/sql-datetime.ts` (12 novel).

`extra-surface.ts` already computes the concept —
`noCounterpartFiles` / `noCounterpartExtras` / `noCounterpartNovel`
(`extra-surface.ts:459-461`, populated at `:1203-1205`) count TS files no `.rb`
maps onto — but there is no way to write ONE reason for such a file.

The mechanism must NOT be a blanket, and the existing design says why: member
inheritance from a container tag is deliberately restricted to interfaces
(`extra-surface.ts:395-408`), because "a tagged class name is usually an
extractor-shape artifact ... whose members DO have Ruby counterparts, so
inheriting there would mask real drift."

PR #5927 has the concrete counterexample.
`connection-adapters/postgresql/schema-statements-class.ts` has
`rubyFile === null` — no Rails counterpart FILE — yet its
`PostgreSQLSchemaStatements` is a renamed port of `PostgreSQL::SchemaStatements`
(postgresql/schema_statements.rb) and ~80 of its names score as `moved`. A
naive file-level tag there would have blanketed exactly the drift that story
existed to find. "No counterpart file" is not the claim "no counterpart name".

The separating signal is already in the report: `moved` means "this name exists
in Rails, just in a different `.rb`", i.e. the precise marker that a rename may
be owed. The six driver files carry zero `moved` names; `schema-statements-class.ts`
carries ~80.

## Acceptance criteria

- A file-level `@noRailsEquivalent <reason>` form exists (e.g. a tag in the
  file's leading JSDoc block) and covers every otherwise-novel name in that
  file, so the six driver-adapter files each carry one reason instead of one
  per declaration.
- The form is REJECTED — a hard error naming the file, not a silent
  no-op — when the file has any `moved` name, or when a Rails counterpart
  `.rb` maps onto it. `postgresql/schema-statements-class.ts` is the
  regression test for the first arm; any file with a `rubyFile` for the second.
- The existing permanence gate applies unchanged: a file-level reason must open
  with `PERMANENT` or `CONVERGEABLE` (`extra-surface.ts:1494-1504`).
- Staleness is reported for the file-level form too: once a Rails counterpart
  file appears, or a name in the file starts scoring `moved`, the tag lands in
  the STALE list rather than continuing to absorb the file.
- `pnpm parity:api:extra --package activerecord` novel totals are unchanged by the
  mechanism itself (converting the six driver files from six declaration tags
  to one file tag each is net-zero on Novel and on Allowed).
- Scoped `pnpm vitest run scripts/api-compare/extra-surface.test.ts` passes,
  with cases for the accept arm and both reject arms.
