---
title: "Convert unconverted Tier-1 files to canonical fixtures (opportunistic)"
status: ready
rfc: "draft-fixtures-adoption"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The adoption inventory flags a small pool of **Tier-1** (mechanically
convertible) test files that don't yet use `useFixtures`. This is the only
pickable fixtures-adoption work; the broader sweep is a non-goal (see RFC
§Non-goals). Low priority — pick up only when a PR is already touching one of
these files.

## Acceptance criteria

- [ ] Re-run `pnpm fixtures:adoption:inventory` to get the **current** unconverted
      Tier-1 list (the committed counts are as-of-generation; several have since
      been ported in unrelated canonical-migration PRs).
- [ ] For each remaining Tier-1 file touched: convert to canonical model +
      Rails-fixture lookup (the PR #2766 shape), not a shallow
      `beforeAll(defineSchema)` trim.
- [ ] Drop the redundant per-file DDL; verify green on all three drivers.
- [ ] Do NOT convert Tier-3/Tier-4 files (out of scope).

## Notes

Cap at 300 LOC per PR. Reference PR #2766 (PessimisticLockingTest) as the gold
standard; #2764 (validations) is the shallow form to avoid. If a candidate is no
longer Tier-1 (already converted upstream), just close it off the list.
