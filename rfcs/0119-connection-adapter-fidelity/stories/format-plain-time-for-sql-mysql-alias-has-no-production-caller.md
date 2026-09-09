---
title: "formatPlainTimeForSqlMysql alias has no production caller"
status: ready
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping PR #7621 (story
`sql-datetime-instant-formatters-have-no-production-callers`), which deleted the
three test-only exports `formatInstantForSql`, `formatInstantForSqlMysql` and
`formatPlainDateTimeForSqlMysql` from
`packages/activerecord/src/connection-adapters/abstract/sql-datetime.ts`.

One sibling of the same shape survived, out of that story's stated scope:

- `formatPlainTimeForSqlMysql` (`sql-datetime.ts:77`) — a bare
  `export const formatPlainTimeForSqlMysql = formatPlainTimeForSql;` alias whose
  only callers are
  `connection-adapters/abstract/precision-roundtrip.trails.test.ts:135,140,160`.

There is no MySQL-specific behaviour behind the alias: it is the identity of
`formatPlainTimeForSql`, and the microsecond clamp the tests are really pinning
lives in `microsecondFraction` (`sql-datetime.ts:80`), reached the same way from
every adapter. Rails has no per-adapter time formatter here either — MySQL's
quoting inherits `quoted_date` unchanged
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:184-198`),
and `ActiveRecord::ConnectionAdapters::MySQL::Quoting`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/quoting.rb`)
defines no `quoted_date` override.

## Converged shape

Delete the `formatPlainTimeForSqlMysql` alias and point its three test callers
at the public surface they are really about — `quotedTime` on a MySQL receiver,
or `formatPlainTimeForSql` directly where the test is about the formatter's
fractional-digit clamp rather than about MySQL.

## Acceptance criteria

- [ ] `formatPlainTimeForSqlMysql` no longer exists in `sql-datetime.ts`.
- [ ] The three `precision-roundtrip.trails.test.ts` cases still pin the
      whole-second and microsecond clamp behaviour, through `quotedTime` /
      `formatPlainTimeForSql`.
- [ ] `pnpm parity:api:extra --package activerecord` does not grow.
