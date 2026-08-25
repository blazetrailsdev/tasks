---
title: "Classify the 410 activerecord call-argument shape rows into convergence clusters"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6348
claim: "2026-08-11T01:14:36Z"
assignee: "arel-collector-argument-order-convergence"
blocked-by: null
closed-reason: null
---

## Context

The RFC 0095 baseline seed (PR #6343) measured the shipped call-argument
population at scale for the first time: 5,619 sites compared, 735 flagged
`shape` rows, 689 of them baselined. **410 of those rows are `activerecord`** —
by far the largest block, and until now sized only by the spike's 32-row hand
sample (RFC 0095 "Measured signal": 69% genuine divergence).

Every row is a ported body that calls what Rails calls with a different
argument count, order, literal value or kwarg key — invisible to `arity.ts`,
`parity:api` and `parity:api:calls`. Rows live in
`scripts/api-compare/call-mismatches-exclude/activerecord/**.json` with
`kind: "args"`, keyed `package + tsFile + rubyName + call + rubyArgs`, so each
one names the TS file, the enclosing method, the call and the Ruby argument
list to converge toward.

This story is the classification pass that makes the burndown schedulable: the
409-row block is far too large for one PR, and RFC 0084's precedent is to
cluster rows by mechanism and file a convergence story per cluster.

## Acceptance criteria

1. Every `activerecord` `kind: "args"` row is classified against the vendored
   Rails body (`vendor/rails/activerecord/lib/active_record/...`) into the RFC
   0095 buckets: (a) genuine divergence, (b) confirmed equivalent, (c) tooling
   noise.
2. Bucket (a) rows are grouped by mechanism and each cluster filed as its own
   convergence story with the Rails `file:line` and the converged argument
   list in the body.
3. Bucket (b)/(c) rows get their placeholder seed `reason` replaced with the
   per-cluster justification (reasons converge by review; rows converge by
   deletion).
4. No baseline row is deleted without the corresponding call site actually
   passing what Rails passes.
5. `pnpm parity:api:calls:args` stays green throughout.
