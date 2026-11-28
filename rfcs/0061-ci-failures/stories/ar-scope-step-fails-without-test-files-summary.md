---
title: "CI: AR PR-scope vitest step fails without a Test Files summary"
status: draft
updated: 2026-11-28
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10857 made the AR lanes' queue driver (`scripts/ci/ar-shard-queue.mts`) and `scripts/ci/ar-non-isolated-cases.sh` fail when vitest runs short of its files. The PR-scoped AR step in `.github/workflows/ci.yml` (`run: pnpm vitest run $AR_SCOPE --project '!system'`, about line 1472) still runs plain vitest with no such check. A silent event-loop drain there (the kind #10846 fixed) would still pass green.

## Acceptance criteria

- That step fails when vitest's output has no `Test Files` summary, or when its JSON report has `numTotalTestSuites == 0`.
