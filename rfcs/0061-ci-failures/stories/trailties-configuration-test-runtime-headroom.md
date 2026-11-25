---
title: "trailties-configuration-test-runtime-headroom"
status: done
updated: 2026-11-25
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10729
claim: "2026-11-25T13:59:45Z"
assignee: "activestorage-many-attached-existing-blobs-order-flake"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/test/application/configuration.test.ts` (316 tests) took 1257s alone in CI run 45149062122. trails#10639 moved it to its own `Trailties Tests (configuration)` matrix leg, but the job-wide `timeout-minutes: 30` (`.github/workflows/ci.yml`, trailties-tests) leaves only ~9 min of headroom, and the file keeps growing as configuration_test.rb parts are ported. Most of the time is per-test app boot through the isolation helpers.

## Acceptance criteria

- The configuration leg has comfortable headroom (well under 20 min) on a standard runner, e.g. by cutting per-test boot cost or splitting the leg across more than one job.
- No test is skipped or renamed; no timeout is raised to get there.
