---
title: "Decide whether twelve-dollar-server keeps --max-semi-space-size=64"
status: done
updated: 2026-11-17
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [examples]
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: "2026-11-17T20:51:44Z"
assignee: "measure-allocation-gap-between-entry-points"
blocked-by: null
closed-reason: null
---

## Context

The evidence for the flag disagrees with itself, and that is why this story
exists. In a fixed-load test at 5,000 users it moved p95 from 121 to about
100 ms.

`examples/twelve-dollar-server/start.sh` now sets
`--max-semi-space-size=64`. On a single rig, trails before and after the flag
landed both scored 7,750 users. The run with the flag peaked at 725 MB against
591 MB without it, and its p99 at the 5-minute hold was 686 ms against 562 ms.

In the 2026-11-16 profile with the flag on, scavenges average **12 ms** each
(p50 12.3 ms, max 19 ms, 430 in 249 s). Major GCs are 42 ms at p50 and 66 ms at
the maximum, 35 of them. A 12 ms scavenge at high utilisation is itself a
source of queueing.

## Acceptance criteria

- [ ] On one rig, run the fixed-load profile harness and one 5-minute hold at the
      current score, with the flag at 16 (V8's default), 32 and 64. Record p95,
      p99, peak memory and the GC log for each.
- [ ] Keep the setting that gives the best p99 within the 2 GB cap, and record the
      numbers in the PR.

## Verification

Run the slim profile harness from the RFC README's "Slim profile harness" section once
per setting, and one challenge hold per setting with `bench/load.js` at
`VUS=7750 DURATION=5m`. Record CPU per request, p95, p99, peak memory and the
GC log's scavenge and major-GC durations in the PR body.
