---
title: "sync-stats: parse test_compare stats from the isolated step log"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by sync-stats-compare-parse-hygiene (2026-08-17 sweep): merged with sync-stats-api-compare-zero-parse-warning. Citations and the dead convention-compare.ts branch carried forward."
---

## Context

In `syncCompareStats` (`scripts/sync-stats/sync.ts`), api stats are parsed
from the _isolated_ step log with an explicit rationale ("Parse the
public-API step in isolation so the privates step (same log format, appended
below it) doesn't overwrite entries"), but test stats are parsed from the
whole raw job log: `parseTestCompareFromLogs(logs)`, not
`parseTestCompareFromLogs(stepLogs.get("test_compare"))`.

`parseTestCompareFromLogs` populates a Map keyed by package name, so the last
matching summary line in the entire log wins. Any second step that emits the
same `pkg — N/M tests (P%) | ... files | ... misplaced` shape would silently
overwrite the real numbers.

Related dead code found while reviewing: `extractStepLogs` maps
`test-compare/convention-compare.ts` to the `test_compare` step name, but
that file no longer exists in `scripts/test-compare/`. The branch is
unreachable and should be removed.

## Acceptance criteria

- Test stats parse from the isolated `test_compare` step log when present,
  falling back to the whole log only when the step boundary is absent (mirror
  the api_compare pattern so historical logs still parse).
- The dead `convention-compare.ts` branch in `extractStepLogs` is removed.
- Verify against the stored `raw_job_logs` in `stats.db` that the isolated
  parse produces identical rows to the current whole-log parse for existing
  history (no silent renumbering of the time series).
