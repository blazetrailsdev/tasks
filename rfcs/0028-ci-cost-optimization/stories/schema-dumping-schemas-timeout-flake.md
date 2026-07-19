---
title: "Fix recurring 'dumping schemas' 5s timeout flake in postgresql/schema.test.ts"
status: in-progress
updated: 2026-07-19
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: 4976
claim: "2026-07-19T22:21:09Z"
assignee: "schema-dumping-schemas-timeout-flake"
blocked-by: null
---

## Context

`packages/activerecord/src/adapters/postgresql/schema.test.ts >
PostgreSQLAdapter > SchemaTest > dumping schemas` recurrently exceeds vitest's
default 5000ms per-test timeout under parallel-fork load:

- PR #3870 postgres-tests run 27951669218 (forks=8): 1 failed / 460 passed,
  `Error: Test timed out in 5000ms` in this exact test; passed on plain rerun.
- The same isolated 5s timeout in the same file appeared in a forks=4 sweep run
  during the same PR's measurement.

The "dumping schemas" case runs a full pg schema dump, which is heavy; under
contention from sibling forks it occasionally crosses the 5s default. This is a
timeout-budget flake, distinct from the shared-table collisions tracked by
flake-elimination-as-ci-cost.

## Acceptance criteria

- [ ] The "dumping schemas" test passes deterministically across ≥5 reruns of
      the postgres AR job at forks=8.
- [ ] Fix by raising the per-test timeout for this specific dump-heavy case
      (Rails has no equivalent 5s budget — verify against the Rails
      schema-dump test) and/or reducing the dump work; do NOT rename the test
      (test:compare matching).

## Notes

Surfaced by tune-ar-db-forks-to-runner-cores (PR #3870). Re-running cleared it,
so it is a flake, not a regression — but it recurs often enough to cost reruns
on the longest CI job.
