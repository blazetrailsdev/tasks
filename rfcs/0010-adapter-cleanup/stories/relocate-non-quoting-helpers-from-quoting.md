---
title: "Relocate non-quoting helpers out of the quoting.ts modules"
status: in-progress
updated: 2026-06-11
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 200
priority: 5
pr: 3132
claim: "2026-06-11T20:39:06Z"
assignee: "relocate-non-quoting-helpers-from-quoting"
blocked-by: null
---

## Context

From the `drop-legacy-crutches` audit (Q7). The `connection-adapters/*/quoting.ts`
modules carry several helpers that are **not quoting concerns** — SQL temporal
serialization, type encode/decode, and schema-default parsing. They live there
mostly because `quote()` once needed them, but they're separable. The existing
`abstract/sql-formatting.ts` re-export shim (whose comment cites the "no
abstract/quoting imports outside the adapter layer" rule) is evidence these are
already considered misplaced. Moving them shrinks the quoting modules to genuinely
quoting surface and makes the drift-collapse story
(`collapse-identical-quoting-overrides`, Q5) cleaner — land this before that one.

These are **pure moves + import updates, no behavior change.** Group by concern:

- **SQL date/time serializers** — `formatInstantForSql`, `formatInstantForSqlMysql`,
  `formatPlainDateTimeForSql`, `formatPlainDateForSql`, `formatPlainTimeForSql`,
  `defaultSqlTimezone`, `quotedDate`, `quotedTime` (in `abstract/quoting.ts`).
  Consumers: `abstract/database-statements.ts`, `mysql/date-time.ts`,
  `abstract/temporal-wire.ts`, `sqlite3-adapter.ts`,
  `postgresql/oid/date-time.ts`, plus the `sql-formatting.ts` re-export. → move to
  a new temporal-serialization module (proposed `abstract/sql-datetime.ts` —
  rename if you prefer). Keep `quote()` working by importing from the new home.
- **PG type encode/decode** — `escapeBytea`, `unescapeBytea` (consumer:
  `postgresql/oid/bytea.ts`), `encodeRange`, `checkIntegerRange` (in
  `postgresql/quoting.ts`). → move to the PG OID/type modules
  (`oid/bytea.ts` / the range type), where their consumers live.
- **SQLite schema-default parsing** — `extractValueFromDefault` (in
  `sqlite3/quoting.ts`, consumer: `sqlite3/schema-statements.ts:146` + the
  `sqlite3-adapter.ts` re-export). → move into `sqlite3/schema-statements.ts`.

**Leave in place:** `columnNameMatcher` / `columnNameWithOrderMatcher` (Rails keeps
these in `Quoting::ClassMethods`; borderline, not worth churn) and all genuine
quoting helpers (`quoteSchemaName`, `quoteBinaryColumn`, `unquoteIdentifier`, the
`quote*`/`quoted*` family).

If the move set exceeds ~500 LOC once import churn is counted, split by concern
(date/time, PG-types, sqlite-default) into separate stories under this RFC rather
than one mega-PR. Proposed module names above are suggestions — confirm against
existing layout before claiming.

Out of scope: any dispatch conversion (Q1–Q4, Q6) — this is relocation only. Not
RFC 0019.

## Acceptance criteria

- [ ] Listed non-quoting helpers moved out of the `quoting.ts` modules to
      concern-appropriate homes; all importers updated
- [ ] `quote()` and the quoting modules still compile and behave identically
      (re-import the relocated date/time helpers as needed)
- [ ] `sql-formatting.ts` re-export shim updated/removed as appropriate
- [ ] `columnNameMatcher` / `columnNameWithOrderMatcher` and genuine quoting
      helpers left in place
- [ ] No behavior change; touched tests pass on all three adapters (run only the
      touched files locally)
- [ ] `api:compare` delta non-negative
