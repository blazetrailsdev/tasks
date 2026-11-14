---
rfc: "0241-request-path-performance"
title: "Request-path performance, measured against Rails on the $12 Server Challenge"
status: active
created: 2026-11-13
updated: 2026-11-14
owner: "@deanmarano"
packages:
  - "activerecord"
  - "activesupport"
  - "ruby-compat"
clusters:
  - request-perf
---

# RFC 0241 — Request-path performance, measured against Rails on the $12 Server Challenge

## Summary

`examples/twelve-dollar-server` scores the same as the gambitboy Rails
submission on the $12 Server Challenge (7,250 users), but its tail latency is
about eight times worse. The cause is allocation, not CPU. This RFC collects the
stories that reduce allocation and CPU on the request path, and the one that
tracks the Perry-compiled build's cost.

## Motivation

These measurements were taken on AWS on 2026-11-13. The server was a c7i.large,
with each app pinned to 1 vCPU and 2 GB through systemd. Load came from k6
(`bench/load.js` from the challenge repo) on a separate c7i.4xlarge, against the
challenge's seed (50k users, 500k posts, 2M likes). All three apps passed the
42-check `test/test.sh`.

|                            | score (5-min hold) | p95    | p99    | peak RSS |
| -------------------------- | ------------------ | ------ | ------ | -------- |
| Rails 8 + YJIT (gambitboy) | 7,250              | 45 ms  | 74 ms  | 427 MB   |
| trails on Node 26          | 7,250              | 363 ms | 432 ms | 616 MB   |
| trails compiled by Perry   | 1,000              | 120 ms | 205 ms | 375 MB   |

At 5,000 users, both Rails and trails cost **1.42 ms of CPU per request**, but
trails' p95 is 121 ms against Rails' 26 ms. The gap stays without writes: on a
read-only load, p95 is 71 ms against 14 ms. Capping in-flight requests at 1 or
4 changes nothing, and SQLite pragmas are identical. Service time inside
`app.call` is p50 1.2 ms and p99 3.8 ms. The tail is V8's major GC: a 36–65 ms
stop every 6–7 s. At 83% utilisation the backlog drains at 17% of capacity, so
one pause becomes a queue of about 300 ms, and the maximum measured latency is
330–340 ms.

trails allocates about **108 KB per request**, about 38 MB/s at 3,000 users.
`--max-semi-space-size=64` moves p95 from 121 to about 100 ms. The rest has to
come from allocating less, and from spending less CPU, since each 10% of CPU
removed takes about a third off the drain time.

All numbers were measured on trails main `094dec8aa8`. trails#10062, which makes `rbCallSuper` cheaper and inlines `init_internals`, merged while the benchmark ran and is not reflected in them.

## Design

One story per measured hot spot. Each story's shares come from a V8 sampling
heap profile, with objects collected by minor and major GC included, or from a
`--cpu-prof` profile of the production server under k6 load. Each story's
acceptance criteria include re-measuring with the same harness: CPU per request
from the cgroup's `cpu.stat` over a 90 s run at 5,000 users, plus p95/p99.

Rails parity still holds. Where Rails allocates in the same shape (for example
`JSONGemEncoder#jsonify` then `generate`), the change keeps the observable
behaviour and the Rails source reference, and changes only the representation.

## Non-goals

- Changing the twelve-dollar-server application to win the benchmark.
- Request caching. The challenge forbids it.
