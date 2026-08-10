---
title: "Surface wide-ratchet baseline drift instead of discovering it at measurement time"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 5869
claim: "2026-08-02T11:06:51Z"
assignee: "detect-stale-wide-ratchet-baseline-drift"
blocked-by: null
closed-reason: null
---

## Context

While measuring PR #5855's delta, a clean reseed on an unmodified `main`
(`pnpm parity:api:calls:reseed` with no source changes) moved
`call-mismatches-wide-unreviewed.json` from `"max": 2837` to `"max": 2787` and
reordered rows in `call-mismatches-wide-exclude/activerecord/relation/query-methods.json`
— i.e. the committed baseline was already 50 rows stale relative to what merged
code produces.

Stale marks make every subsequent story's measured delta wrong unless the agent
first reseeds on a clean tree (a full extract + compare, several minutes) just to
establish an honest before-value. The ratchet lints pass either way, since a
stale-high mark is never violated, so nothing surfaces the drift.

## Acceptance criteria

- CI (or the wide ratchet lint) reports when a clean reseed would change the
  high-water mark or the baseline row set, so drift is visible at merge time
  rather than discovered by the next story.
- Decide and document whether drift fails the gate or is advisory-only; a
  ratchet that only shrinks argues for tightening the mark automatically.
