---
title: "Keep the AR shard duration table fresh"
status: done
updated: 2026-11-25
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#10739
claim: "2026-11-25T13:59:45Z"
assignee: "activestorage-many-attached-existing-blobs-order-flake"
blocked-by: null
closed-reason: null
---

## Context

trails#10272 committed `scripts/ci/ar-shard-durations.json`, built once by `node scripts/ci/ar-shard-durations.mjs 44171118164` from one green main run. `scripts/ci/duration-sequencer.ts` gives any file missing from the table the table's median weight, and nothing refreshes the table. As AR test files are added, moved or slowed down, the partition drifts back toward the systematic imbalance that trails#10272 removed.

## Acceptance criteria

- The table is refreshed on a schedule, for example a weekly workflow that runs `ar-shard-durations.mjs` against the latest green main run and opens a PR with the result. Alternatively, a check fails when the share of files missing from the table passes a threshold.
- The refresh averages more than one run, so that a single slow runner's times do not skew the table (trails#10272 measured about ±25% runner variance).
