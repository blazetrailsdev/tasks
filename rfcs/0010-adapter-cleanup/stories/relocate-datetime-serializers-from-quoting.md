---
title: "Relocate SQL date/time serializers (and residual PG range/int helpers) out of quoting.ts"
status: done
updated: 2026-06-12
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 250
priority: 5
pr: 3141
claim: "2026-06-12T00:41:59Z"
assignee: "relocate-datetime-serializers-from-quoting"
blocked-by: null
---

## Context

Split out of `relocate-non-quoting-helpers-from-quoting` (RFC 0010, from the
`drop-legacy-crutches` Q7 audit). That story relocated the two small,
self-contained concerns — PG bytea encode/decode (`escapeBytea`/`unescapeBytea`
→ `postgresql/oid/bytea.ts`) and SQLite schema-default parsing
(`extractValueFromDefault` → `sqlite3/schema-statements.ts`) — and shipped them
in one PR under the 300-LOC ceiling. The large date/time concern (~430 LOC of
churn on its own) did not fit and is deferred here.

Remaining non-quoting helpers still in the `quoting.ts` modules:

- **SQL date/time serializers** (`abstract/quoting.ts`): `formatInstantForSql`,
  `formatInstantForSqlMysql`, `formatPlainDateTimeForSql`,
  `formatPlainDateTimeForSqlMysql`, `formatPlainTimeForSqlMysql`,
  `formatPlainDateForSql`, `formatPlainTimeForSql`, `defaultSqlTimezone`,
  `quotedDate`, `quotedTime`, plus their private helpers (`formatDatePrefix`,
  `padYear`, `formatZonedComponents`, `formatPlainComponents`,
  `formatTimeComponents`). → move to a new temporal-serialization module
  (proposed `abstract/sql-datetime.ts`). Keep `quote()`/`typeCast()` working by
  re-importing from the new home.
  Consumers: `abstract/database-statements.ts`, `abstract/temporal-wire.ts`,
  `mysql/quoting.ts`, `mysql/date-time.ts`, `sqlite3/quoting.ts`,
  `sqlite3-adapter.ts`, `postgresql/oid/date-time.ts`, `postgresql/quoting.ts`
  (`quotedDate` as `abstractQuotedDate`), plus the `abstract/sql-formatting.ts`
  re-export shim — update/remove that shim as appropriate.

- **Residual PG type helpers** (`postgresql/quoting.ts`): `encodeRange` (dead —
  exported but unimported; depends on the private `typeCastRangeValue`) →
  `postgresql/oid/range.ts`. `checkIntegerRange`/`checkIntInRange` were
  deliberately LEFT in `postgresql/quoting.ts` by the parent story because Rails
  keeps `check_int_in_range` in `PostgreSQL::Quoting` — confirm against Rails
  before moving; leaving them is acceptable.

- **bytea `escapeBytea`/`unescapeBytea` — DO NOT move.** The parent story's Q7
  audit grouped these under "PG type encode/decode" for relocation to
  `postgresql/oid/bytea.ts`, but Rails defines `escape_bytea`/`unescape_bytea`
  in `PostgreSQL::Quoting` (`postgresql/quoting.rb`). Moving them out of
  `quoting.ts` drops the api:compare match (verified −2 matched methods on
  PR #3132) and diverges from Rails. They stay in `postgresql/quoting.ts`.

Pure moves + import updates, no behavior change. If date/time alone exceeds the
LOC ceiling, ship just date/time and drop the PG-range residue from this story.

Out of scope: any dispatch conversion. Not RFC 0019.

## Acceptance criteria

- [ ] Date/time serializers moved out of `abstract/quoting.ts` to a new
      temporal-serialization module; all importers updated
- [ ] `quote()`/`typeCast()` and the quoting modules still compile and behave
      identically (re-import the relocated helpers as needed)
- [ ] `abstract/sql-formatting.ts` re-export shim updated/removed as appropriate
- [ ] `columnNameMatcher`/`columnNameWithOrderMatcher` and genuine quoting
      helpers left in place
- [ ] No behavior change; touched tests pass on all three adapters
- [ ] `api:compare` delta non-negative
