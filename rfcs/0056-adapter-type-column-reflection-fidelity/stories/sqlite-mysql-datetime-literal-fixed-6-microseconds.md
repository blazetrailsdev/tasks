---
title: "SQLite/MySQL datetime SQL literals use Rails fixed-6 microsecond form (quoted_date parity)"
status: ready
updated: 2026-06-23
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3956 converged `value_for_database` to return the cast Temporal value and
moved SQL-string quoting to the adapter quote/bind layer. As part of that, the
PostgreSQL literal path was made Rails-faithful (fixed 6-digit microseconds via
`sprintf("%06d", usec)`, capped at microseconds) in
`packages/activerecord/src/connection-adapters/abstract/sql-datetime.ts`
(`formatInstantForSqlPostgres` etc.).

The **abstract (SQLite) and MySQL** datetime literal formatters still diverge
from Rails' `quoted_date`:

- `formatTimeComponents` (sql-datetime.ts:149) emits a **trimmed 3/6/9-digit
  group** (`.500`, `.123`), whereas Rails `abstract/quoting.rb:194-195` emits a
  fixed 6-digit microsecond field whenever `usec > 0` (`.500000`).
- The abstract `formatInstantForSql` can emit **7–9 fractional digits** for a
  nil-precision nanosecond value (e.g. from `Temporal.Now`), where Rails caps at
  microseconds. SQLite stores these in TEXT (harmless at rest) but the literal
  diverges from Rails.

This was explicitly scoped out of PR #3956 (review flagged it as pre-existing
for mysql/sqlite binds; only PG was newly affected and was fixed there).

Minor related gap: `quoteSqlValue` array-literal callers at
`packages/activerecord/src/base.ts` (the two PG `arelSql(quoteSqlValue(raw, true))`
sites) do not pass a `dialect`, so a datetime element inside a PG array literal
skips the BC/fixed-6 PG formatting. Edge case; fold in if cheap.

## Acceptance criteria

- [ ] SQLite/MySQL datetime SQL literals emit a fixed 6-digit microsecond field
      when `usec > 0` and omit it otherwise, matching Rails `quoted_date`.
- [ ] Fractional seconds are capped at microseconds (no 7–9 nanosecond digits)
      on the SQLite/MySQL literal/bind paths.
- [ ] Reuse the PG helpers' approach (or generalize them) rather than
      duplicating; PG behavior unchanged.
- [ ] Unit coverage for `.5 → .500000`, usec==0 omission, and the µs cap on
      sqlite/mysql, mirroring the PG tests added in PR #3956.
- [ ] test:compare / api:compare delta non-negative.
