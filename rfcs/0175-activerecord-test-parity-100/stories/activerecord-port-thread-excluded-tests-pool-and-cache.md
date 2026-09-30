---
title: "activerecord: port the 24 Thread/GVL-excluded pool, handler and cache tests over withExecutionContext"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: unported-tests
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The unported register (`scripts/parity/unported-files/unscoped.ts`) excludes Rails tests that spawn Ruby
`Thread`s as "GVL / Ruby Thread semantics — cannot translate to single-threaded Node". RFC 0147
(execution context at thread-spawn sites, closed) settled the analogue: `Thread.new` is
`withExecutionContext` (memory note), and ruby-compat ports `Monitor`, `Mutex`, `ConditionVariable`-style
waits. The concurrency these tests assert is interleaving across async contexts — which is exactly the
hazard CLAUDE.md § "The adapter lock defaults to a monitor" describes. This story:

- `asynchronous_queries_test.rb` — (whole file)
  reason: SOURCE NOW PORTED (asynchronous_queries_tracker.rb — story call-args-ar-select-all-empty-async-row); this is a test-only entry. The tests assert Concurrent::ThreadPoolExecutor sizing (min/max threads, max queue) and cros
- `adapter_test.rb` — "#active? is synchronized"; "#verify! is synchronized"
  reason: AdapterThreadSafetyTest exercises Ruby Thread.new/Thread.pass concurrency on a single shared connection, asserting mutex-style serialization of #active?/#verify!/#disconnect! under the GVL. Node Worker threads use isolat
- `connection_pool_test.rb` — "lock thread allow fiber reentrency"; "released connection moves between threads"; "inactive are returned from dead thread"; "remove connection for thread"; "concurrent connection establishment"; "non bang disconnect and clear reloadable connections throw exception if threads dont return their conns"; "disconnect and clear reloadable connections attempt to wait for threads to return their conns"; "bang versions of disconnect and clear reloadable connections if unable to acquire all connections proceed anyway" …
  reason: GVL / Ruby Thread semantics — concurrent connection tests cannot translate to single-threaded Node.js.
- `connection_management_test.rb` — "connections are cleared even if inside a non-joinable transaction"; "cancel asynchronous queries if an exception is raised"
  reason: GVL / Ruby Thread semantics — first test pins across threads; second uses FutureResult (thread-based async queries).
- `connection_adapters/connection_handlers_multi_db_test.rb` — "multiple connections works in a threaded environment"
  reason: GVL / Ruby Thread semantics — concurrent multi-db connection access on shared objects has no single-threaded Node.js equivalent.

## Acceptance criteria

- [ ] Each case is ported with Rails' body, each `Thread.new {{ … }}` spelled `withExecutionContext(async () => …)`, and passes on the adapter lanes Rails runs it on; its unported entry is deleted.
- [ ] A case that genuinely needs preemption (a busy-wait no JS scheduler can interleave) is split into its own story with the specific blocker, not left in the register with a generic GVL reason.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm vitest run scripts/parity/unported-files.test.ts scripts/parity/unported-live-test.test.ts
```
