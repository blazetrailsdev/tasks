---
title: "Group and report the wide call-set population by cause"
status: done
updated: 2026-07-30
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 220
priority: 1
pr: 5650
claim: "2026-07-30T17:42:41Z"
assignee: "wide-ratchet-report-and-grouping"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:calls` prints only flat `+ added` / `- stale` lists
(`scripts/api-compare/lint-call-mismatches-wide.ts:255-281`). With 4794
baselined entries across 505 files there is no way to see where the population
lives or why, so no one can pick a coherent chunk of work off it.

The investigation (2026-07-30) produced the grouping offline with a throwaway
Python script. It should live in the tool.

## Acceptance criteria

- A `--report` flag on `lint-call-mismatches-wide.ts` prints, from the baseline
  plus the current artifact: totals by package, by `tsFile` (top N), by Ruby
  call name, and by cause bucket.
- Cause buckets are derived, not hand-maintained: `same-file candidate takes
args` / `same-file zero-arg member` / `candidate elsewhere in package` /
  `candidate not in package`, computed from `output/ts-api.json` the same way
  the investigation did.
- An `--unreviewed` count reports entries whose `reason` still equals the
  `DEFAULT_REASON` constant (`lint-call-mismatches-wide.ts:96-98`) — currently
  4445 of 4794.
- `--report` is read-only: it never writes the baseline and exits 0.
- The gate's default output and exit codes are unchanged.
- Unit tests in `lint-call-mismatches-wide.test.ts` cover bucket assignment.
