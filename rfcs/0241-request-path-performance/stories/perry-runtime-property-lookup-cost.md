---
title: "Perry build: measure and report the runtime's property-lookup cost on the twelve-dollar server"
status: ready
updated: 2026-11-14
rfc: "0241-request-path-performance"
cluster: request-perf
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The Perry-compiled twelve-dollar server (built by the perry-wall29 compiler,
which includes the "inherited-receiver override across a Proxy get trap" fix,
from the prototype ladder tree) passes 42/42 checks. It scores 1,000 users
against Node's 7,250. Its serial CPU per request is:

|         | /feed   | /posts/:id | /health |
| ------- | ------- | ---------- | ------- |
| Node 26 | 1.8 ms  | 2.4 ms     | 1.1 ms  |
| Perry   | 11.5 ms | 7.4 ms     | 3.7 ms  |

The process is idle at 7 ms of CPU per second, so this is not spinning. A
`perf record -e cpu-clock -g` of the `PERRY_KEEP_SYMBOLS=1` build at 1,000
users, bucketed by symbol:

- property lookup (`shapes`, `keys_find_slot_by_bytes` 2.8%, `get_field_by_name`, `native_get`, `layout_probe`): **35%**
- prototype, class and `instanceof` (`class_generic_origin_slow`, `prototype_accessor`, `js_instanceof_dynamic`, `get_prototype_of`): **13%**
- GC and allocation (`mimalloc`, `try_read_tracked_gc_header`, nursery `mark_addr`): **12%**
- calls and closures: 8%
- `from_utf8` and strings: 4%
- regex: 2.5%
- SQLite: 1%

The binary embeds absolute build paths (`import.meta.dirname`) and still reads
the app and package directories from disk at boot, so it runs only where the
build tree exists at the same path.

## Acceptance criteria

- File the property-lookup and class-origin findings upstream against the
  Perry fork, with this profile and a reduced reproducer: a hot loop of named
  reads on objects that share a shape through an inherited prototype chain.
- File the baked-path and runtime-filesystem dependency as a separate Perry
  ladder finding in `examples/perry-native/perry/FINDINGS.md`.
- Record the perf method in FINDINGS: build with symbols, then
  `perf record -e cpu-clock` on the target, because the VM exposes no cycles
  PMU.
