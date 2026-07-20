---
title: "arel-duplicates-adapter-datetime-formatters"
status: claimed
updated: 2026-07-20
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-20T23:26:45Z"
assignee: "arel-duplicates-adapter-datetime-formatters"
blocked-by: null
closed-reason: null
---

## Context

`packages/arel/src/visitors/default-quoter.ts` (as of #5020) carries its own
`quotedDate` / `quotedTime` / `formatPlainDateTime` / `padYear`, duplicating
`packages/activerecord/src/connection-adapters/abstract/sql-datetime.ts`
(`formatInstantForSql`, `formatPlainDateTimeForSql`, `formatPlainDateForSql`,
`padYear`) and `abstract/quoting.ts:582+` (`quotedDate`, `quotedTime`).

The copy exists because `arel` must not depend on `activerecord`. But `arel`
already depends on `@blazetrails/activesupport` (it imports `Temporal` from
`@blazetrails/activesupport/temporal`), so a shared home exists.

Two divergences were caught in review of #5020 that the shared copy would have
prevented outright: the `ZonedDateTime` arm emitted its wall clock instead of
converting (adapter twin does `value.toInstant()`, `quoting.ts:591`), and a
locally-written `pad(year, 4)` turned year `-1` into `"00-1"` where
`sql-datetime.ts` has `padYear` for exactly that case. Both are fixed in #5020;
the structural duplication that produced them is not.

This is the same drift `arel-quote-array-duplicates-adapter-encode-array`
names, in the datetime-formatting dimension rather than the array-encoding one.

## Acceptance criteria

- [ ] Decide whether the Temporal→SQL formatters belong in `activesupport`
      (reachable from both `arel` and `activerecord`) or whether the arel copy
      should be justified as permanent, and record the decision.
- [ ] If hoisted: `default-quoter.ts` and `abstract/sql-datetime.ts` share one
      implementation of the `YYYY-MM-DD HH:MM:SS[.ffffff]` formatting and of
      `padYear`; the timezone-aware layer (`default_timezone`) stays in
      activerecord, since that setting cannot move.
- [ ] The PG `BC`-suffixing variants (`formatInstantForSqlPostgres` et al.)
      are considered — they are adapter-specific and may stay put.
- [ ] No behaviour change on the real adapter path.
- [ ] api:compare / test:compare delta non-negative.

## Notes

Low urgency, structural. Blast radius of the arel copy is the connection-less
`Node#toSql()` debug path only.
