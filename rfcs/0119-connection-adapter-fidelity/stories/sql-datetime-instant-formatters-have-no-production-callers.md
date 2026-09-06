---
title: "sql-datetime-instant-formatters-have-no-production-callers"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #7543. That PR converged `quoted_date`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:184-198`)
so the `default_timezone` branch and the `to_fs(:db)` dispatch live in the body,
which left three exports in
`packages/activerecord/src/connection-adapters/abstract/sql-datetime.ts` with no
production caller:

- `formatInstantForSql`
- `formatInstantForSqlMysql` (its alias)
- `formatPlainDateTimeForSqlMysql`

They are referenced only from `packages/activerecord/src/quoting.test.ts`,
`connection-adapters/abstract/precision-roundtrip.trails.test.ts`, and
`connection-adapters/abstract/temporal-wire.trails.test.ts` (the two
round-trip-symmetry cases at `:206` and `:214`).

`sql-datetime.ts` is a whole-file `@noRailsEquivalent PERMANENT` seam, so the
exports are not flagged by `parity:api:extra`, but an export with only test
callers is surface the repo does not need.

## Acceptance criteria

- [ ] Each of the three exports is either retargeted at a real caller or
      deleted, with its tests pointed at `quotedDate` / `typeCast` — the public
      surface those tests are really about.
- [ ] `temporal-wire.trails.test.ts`'s two round-trip cases keep their names and
      still pin parser/formatter symmetry under `default_timezone = :local`.
- [ ] `pnpm parity:api:extra --package activerecord` does not grow.
