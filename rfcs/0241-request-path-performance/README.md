---
rfc: "0241-request-path-performance"
title: "Request-path performance, measured against Rails on the $12 Server Challenge"
status: active
created: 2026-11-13
updated: 2026-11-16
owner: "@deanmarano"
packages:
  - "activerecord"
  - "activesupport"
  - "ruby-compat"
  - "activemodel"
  - "rackup"
  - "trailties"
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

### Re-bench and second profile (2026-11-16)

A re-bench on trails main `2233298a35` (with trails#10062,
trails#10087, trails#10093 and trails#10094) ran on a rebuilt rig that turned out faster: Rails scored **9,000**
there, against 7,250 on the first rig. On that one rig, trails before the
fixes (`094dec8aa8`) and after them both scored **7,750**. The fixes did not
move the score, and trails is 1,250 users behind Rails on equal hardware.

The second profile used a slimmer harness, which later stories reuse:

- **Rig:** one c7i.xlarge. The server runs in a cgroup pinned to cpu0 with a
  2 GB cap, cpu2 (cpu0's hyperthread sibling) is left idle, and k6 runs on
  cpus 1 and 3.
- **Load:** a 30 s warm-up at 1,000 users, then 2 minutes at 4,000 users
  (about 540 req/s) of the challenge's `bench/load.js`.
- **Passes:** one plain pass for latency and CPU per request, one with
  `--cpu-prof` and a `PerformanceObserver` GC log, and one with an inspector
  sampling heap profile that includes objects collected by minor and major GC.

Results on trails main `8dc7d65058`:

- **Plain pass:** 1,324 µs of CPU per request, p95 18 ms, p99 158 ms.
- **GC:** 8.3% of busy CPU. Scavenges average 12 ms each with
  `--max-semi-space-size=64`, and major GCs are 42 ms at p50 and 66 ms at most.
- **Allocation:** about 267 KB per request in this harness. That is not
  comparable to the 108 KB above, which was taken through a different entry
  point and load.

Hot spots without a story before this profile, in shares of busy CPU or
allocated bytes:

| Site                                            | Share                     | Story                                        |
| ----------------------------------------------- | ------------------------- | -------------------------------------------- |
| Fresh `prepare` for the unpreparable feed query | 8.4% CPU                  | `unpreparable-select-statement-compile-cost` |
| `Relation#clone` descriptor path, after #10094  | 6.3% bytes, 4.1% CPU      | `relation-clone-descriptor-fallback`         |
| First read of a loaded attribute                | about 12% bytes, 2.4% CPU | `attribute-first-read-allocations`           |
| `respond_to?` resolution                        | 3.5% CPU                  | `respond-to-lookup-cache`                    |
| `stmt.columns()` three times per query          | 1.7% CPU                  | `sqlite-statement-columns-read-once`         |
| Rack env build and `envConfig` merge            | 0.8% CPU, 1.6% bytes      | `node-handler-env-allocation`                |
| `Thread.new` stack capture per request          | 0.6% CPU                  | `thread-creation-frame-lazy`                 |
| Young-generation size                           | 12 ms scavenges           | `semi-space-flag-evaluate`                   |

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
