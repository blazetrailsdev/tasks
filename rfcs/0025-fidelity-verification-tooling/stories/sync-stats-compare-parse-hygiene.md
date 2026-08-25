---
title: "sync-stats: zero-parse guard for api_compare and isolated-step parse for test_compare"
status: draft
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Combines two RFC 0025 drafts (swept 2026-08-17). Both are parsing hygiene in
the same function, `syncCompareStats` (`scripts/sync-stats/sync.ts`).

### `parseApiCompareFromLogs` has no zero-parse guard

PR #5721 added a zero-parse drift warning for `test_compare`: when a job log
contains that step but `parseTestCompareFromLogs` returns zero packages, the
sync warns per-log and in the run summary. The guard exists because a
summary-line format change (#3825's nested `N extra (TS only)` parenthetical)
silently emptied the `test_compare_stats` feed for **six weeks** with no error.

`parseApiCompareFromLogs` has the identical failure mode and no such guard. It
carries two regexes (`reNew` for the method-centric format, `reOld` for the
historical classes/modules format), so it has already survived one format
migration — the next one fails silently exactly as `test_compare` did. The
`api_compare_privates` feed is in the same position.

### test stats are parsed from the whole job log, not the isolated step

In the same function, api stats are parsed from the _isolated_ step log with an
explicit rationale ("Parse the public-API step in isolation so the privates
step (same log format, appended below it) doesn't overwrite entries") — but test
stats use `parseTestCompareFromLogs(logs)`, not
`parseTestCompareFromLogs(stepLogs.get("test_compare"))`.

`parseTestCompareFromLogs` populates a Map keyed by package name, so the last
matching summary line in the whole log wins. Any second step emitting the same
`pkg — N/M tests (P%) | … files | … misplaced` shape silently overwrites the
real numbers — the api side already had to be fixed for exactly this.

Dead code found while reviewing: `extractStepLogs` maps
`test-compare/convention-compare.ts` to the `test_compare` step name, but that
file no longer exists in `scripts/test-compare/`.

Both feeds are trails-internal tooling — no Rails counterpart, so this is not a
convergence story.

## Acceptance criteria

- `syncCompareStats` warns per-log and in the run summary when an
  `api_compare` (and `api_compare_privates`) step is present but parses zero
  packages, matching the existing `test_compare` guard.
- Test stats are parsed from `stepLogs.get("test_compare")`, not the whole raw
  job log.
- The dead `convention-compare.ts` branch in `extractStepLogs` is removed.
- A test covers each: a log whose api summary format changed parses zero and
  warns; a log with a second step emitting the test-compare shape does not
  overwrite the real numbers.
