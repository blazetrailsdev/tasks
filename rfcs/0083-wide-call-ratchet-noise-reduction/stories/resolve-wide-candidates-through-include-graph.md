---
title: "Resolve wide-call candidates through the recorded include/extends graph"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: ["audit-wide-cross-file-mixin-attribution"]
deps-rfc: []
est-loc: 250
priority: 7
pr: 5755
claim: "2026-07-31T20:44:45Z"
assignee: "resolve-wide-candidates-through-include-graph"
blocked-by: null
closed-reason: null
---

## Context

Follows `audit-wide-cross-file-mixin-attribution`, which classifies the ~1606
cross-file rows and specifies the resolution rule. Do not start this before that
audit is committed — the bucket mixes tooling artifact with real divergence, and
a blind widening suppresses genuine fidelity gaps.

`ts-api.json` already records `includes` and `extends` per class
(`extract-ts-api.ts`; visible in every `classes`/`modules` entry). The resolution
should walk that recorded graph, not guess by filename proximity.

## Acceptance criteria

- Candidate resolution in `checkCalls` consults the recorded include/extends
  graph for the paired TS class, scoped exactly as the audit recommends.
- Resolution is NOT filename- or directory-proximity based.
- Rows the audit classified as real divergence still flag — the PR body cites
  the audit's count and shows the post-change count matching it.
- Baseline reseeded; expected delta −1100 to −1600 wide rows, and the PR body
  states the measured figure against the audit's projection.
- Depends on: audit-wide-cross-file-mixin-attribution.
