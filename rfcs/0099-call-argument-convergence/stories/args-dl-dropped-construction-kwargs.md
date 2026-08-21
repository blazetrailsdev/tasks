---
title: "Converge the dropped constructor kwargs"
status: claimed
updated: 2026-08-21
rfc: "0099-call-argument-convergence"
cluster: api-compare
packages: ["activerecord", "activemodel"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-21T14:48:15Z"
assignee: "args-dl-adapter-factory-invented-kwarg"
blocked-by: null
closed-reason: null
---

## Context

Three `kind: "args"` rows where Rails passes a keyword-argument hash to a
constructor and the port passes nothing. All three are still in the baseline
after RFC 0099's first pass; each is a real dropped argument, not a tooling
artifact.

| TS file                                                               | Ruby                              | Rails passes                                                                                                 |
| --------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `activemodel/src/attribute-methods.ts`                                | `attribute_method_patterns_cache` | `Concurrent::Map.new(initial_capacity: 4)` — `activemodel/lib/active_model/attribute_methods.rb:418`         |
| `activerecord/src/connection-adapters/abstract/connection-handler.ts` | `initialize`                      | `Concurrent::Map.new(initial_capacity: 2)` — `connection_handler.rb:78`                                      |
| `activerecord/src/connection-adapters/abstract/connection-pool.ts`    | `build_async_executor`            | `min_threads:`, `max_threads:`, `max_queue:`, `fallback_policy: :caller_runs` — `connection_pool.rb:717-722` |

The first two are capacity hints on a concurrent map and are arguably inert in
a single-threaded runtime — but that is a judgement to record at the call site,
not to leave unstated in a baseline row. The third drops an entire thread-pool
configuration, which is the one with real behavioural stakes.

## Acceptance criteria

- Each call site either passes what Rails passes, or carries a
  `@missingRailsCall` / reviewed one-line baseline `reason` naming the TS
  reason it cannot (e.g. the executor has no thread pool to configure).
- The three `kind: "args"` rows are deleted from
  `scripts/api-compare/call-mismatches-exclude/**` by hand — no `--write`, no
  reseed.
- `pnpm parity:api:calls:args` green; the data-layer shape population drops by
  the rows converged.
