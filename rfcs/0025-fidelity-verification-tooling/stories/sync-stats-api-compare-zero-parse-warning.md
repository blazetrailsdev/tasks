---
title: "sync-stats: warn when an api_compare step log parses zero packages"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by sync-stats-compare-parse-hygiene (2026-08-17 sweep): merged with sync-stats-test-compare-parse-isolated-step — both are parsing hygiene in syncCompareStats. Citations carried forward."
---

## Context

PR #5721 added a zero-parse drift warning to `syncCompareStats`
(`scripts/sync-stats/sync.ts`): when a job log contains a `test_compare` step
but `parseTestCompareFromLogs` returns zero packages, the sync warns per-log
and in a run summary. That guard exists because a summary-line format change
(#3825's nested `N extra (TS only)` parenthetical) silently emptied the
`test_compare_stats` feed for six weeks with no error.

`parseApiCompareFromLogs` has the identical failure mode and no such guard.
It carries two regexes (`reNew` for the method-centric format, `reOld` for the
historical classes/modules format), so it has already survived one format
migration — the next one fails silently exactly as test_compare did. The
`api_compare_privates` feed is in the same position.

## Acceptance criteria

- `syncCompareStats` warns per-log and in the run summary when an
  `api_compare` step log is present but zero packages parse, mirroring the
  existing `zeroParseTestCompare` counter.
- Same for `api_compare_privates`, gated on the step actually having run
  (the log must contain `compare.ts --privates`), so logs predating the
  privates step do not false-positive.
- Unit coverage for the warning conditions.
