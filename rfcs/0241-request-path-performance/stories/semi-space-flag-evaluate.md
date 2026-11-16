---
title: "Decide whether twelve-dollar-server keeps --max-semi-space-size=64"
status: ready
updated: 2026-11-16
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [examples]
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

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
