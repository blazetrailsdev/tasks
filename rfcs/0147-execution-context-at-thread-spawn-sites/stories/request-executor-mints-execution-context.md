---
title: "Mint an execution context per request at ActionDispatch::Executor"
status: ready
updated: 2026-09-11
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: ["activesupport", "actionpack", "activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `spawn-sites-mint-execution-context` (RFC 0147 Design §1). The
async-executor (`connection_pool.rb:697`) and reaper (`reaper.rb:41`) spawn
sites now mint a context via `withExecutionContext`. The request site did not
fit: `ActionDispatch::Executor#call` (`actionpack/lib/action_dispatch/middleware/executor.rb:13-14`)
lives in `packages/actionpack/src/action-dispatch/middleware/executor.ts`, and
actionpack does not depend on activerecord, so it cannot import
`withExecutionContext` (`activerecord/src/connection-adapters/abstract/connection-pool/execution-context.ts`).

Rails keys leases on `IsolatedExecutionState.context` (`connection_pool.rb:710-711`),
which is the request's Thread/Fiber — an activesupport concept. The likely
convergence is to move context minting onto activesupport's
`IsolatedExecutionState` (a fresh store per request, e.g. `IsolatedExecutionState.run`
in `Executor#call`) and have `executionContext()` derive identity from it,
while unscoped top-level code still resolves to `ROOT_CONTEXT`.

## Acceptance criteria

- [ ] Two concurrent requests through `ActionDispatch::Executor` get distinct
      `Lease` objects from `leaseConnection()`, no opt-in at the call site.
- [ ] Unscoped top-level code still resolves to `ROOT_CONTEXT`.
- [ ] Rails `file:line` cited for the site.
