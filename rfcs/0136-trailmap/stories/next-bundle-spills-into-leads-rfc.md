---
title: "Port next-bundle's cross-cluster spill into the lead's RFC"
status: in-progress
updated: 2026-11-23
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: trailmap#197
claim: "2026-11-23T15:45:07Z"
assignee: "next-bundle-spills-into-leads-rfc"
blocked-by: null
closed-reason: null
---

## Context

tasks@6f2ff42f5 ("feat(next-bundle): spill leftover budget into the lead's RFC
across clusters") changed the CLI's `nextBundle` in `src/ranking.ts`. When the
lead's cluster cannot use the rest of the budget, the CLI now tops it up from
other clusters in the lead's own RFC, and sorts fill + spill together by
priority.

trailmap's port (`app/models/concerns/ranking.ts`, and the Rails twin) still
returns lead + same-cluster fill only. `pnpm gate` on CI now reports
NOT EQUIVALENT: `next-bundle --max-loc 500` (6 cli vs 5 trailmap) and
`--max-loc 700` (7 vs 5), first difference at 1
(cli=activestorage-s3-controller-tests trailmap=sqlite3-execute-batch2-sync-engine-typing).
Every trailmap PR's gate check is red until this lands (first seen on trailmap#196).

## Acceptance criteria

1. `nextBundle` in trailmap and `rails/` spills into the lead's RFC across clusters, exactly as tasks@6f2ff42f5 does.
2. A test on each side mirrors `src/ported.test.ts`'s new case.
3. `pnpm gate` is EQUIVALENT against a current tasks.db.
