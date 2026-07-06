---
title: "Triage the 183 value-accessor-read-surfaced wide-call baseline entries"
status: ready
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4656 (credit-value-accessor-reads-in-wide-call-gate) taught `extractCalls`
(`scripts/api-compare/extract-ts-api.ts`) to credit property READS as calls
(Ruby reader-call semantics). This surfaced **183 newly-gate-subject wide-call
mismatches** in `scripts/api-compare/call-mismatches-wide-exclude.json`: methods
whose call set was previously empty (`if (!tsCandidateSets?.length) return;` in
compare.ts) became gate-subject once their reads counted.

These 183 were baselined **in bulk, NOT individually vetted** — each carries the
same mechanism-level reason string ("Newly gate-subject after value-accessor
read-crediting … baselined in bulk, NOT individually vetted, pending per-cluster
burndown review."). The specific missing call in each may be a genuine
value-accessor read, a bucket-(b) confirmed equivalent, or a real omission
(e.g. `metal/live.ts abort -> synchronize`, `metal/mime-responds.ts
any_response? -> fetch`).

## Acceptance criteria

- Triage the 183 bulk-baselined wide-call entries per-cluster: for each, either
  remove it (converged / genuinely satisfied via a different path — with a
  specific reason), or file/fix the real omission it exposes.
- Replace the shared bulk reason with per-entry (or per-cluster) specific reasons.
- `pnpm api:calls:wide` stays green throughout; baseline only shrinks.
- Identify entries by diffing the exclude JSON at PR #4656's merge commit.
