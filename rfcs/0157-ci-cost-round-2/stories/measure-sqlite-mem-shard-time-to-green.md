---
title: "Measure main time-to-green before/after sharding sqlite-mem-tests (RFC 0028 protocol)"
status: closed
updated: 2026-09-24
rfc: "0157-ci-cost-round-2"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "don't need to measure, it's ok"
---

## Context

trails#8015 split `sqlite-mem-tests` (`.github/workflows/ci.yml`, "Active Record SQLite :memory: Tests") into two legs with `--shard=${{ matrix.shard }}/2`. It merged without the RFC 0028 before/after measurement, because that needs `main` runs made after the merge.

Measured so far:

- Before: 789s unsharded on green `main` run 35872727737 (the number in the story); 579s on `main` run 35240336716 (2026-09-17, 757 files).
- On the PR (run 35920538525): the legs took 252s and 431s. They ran 382 + 381 = 763 files (the full unsharded count) and 5890 + 7180 = 13070 tests.

The legs are uneven: file-level `--shard` split the files evenly, but leg 2 had about 1,300 more tests and took 179s longer.

## Acceptance criteria

- [ ] Take the median `main` time-to-green over at least 5 green runs before trails#8015 and at least 5 after, and record both. Before-runs must be runs where `sqlite-mem-tests` ran; it only runs on `main`, the Monday sweep, `workflow_dispatch` and `run-sqlite-mem`-labelled PRs.
- [ ] Record the per-leg wall times of `sqlite-mem-tests` across those runs, and check that the slowest leg is now faster than the PostgreSQL shards.
- [ ] If there is no measured improvement, revert trails#8015 as RFC 0028 requires, or open a follow-up story. If leg 2 still sets the critical path, look at rebalancing the legs (for example `--shard` with more legs, or a slower-file-first ordering).
