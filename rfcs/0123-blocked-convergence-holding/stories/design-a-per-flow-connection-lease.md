---
title: "activerecord: design a per-flow connection lease so the adapter lock and the server-version barrier can take Rails' shape"
status: draft
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Owner ruling, 2026-10-08 (blocked-story triage, decision 16): design a
per-flow lease.

Rails leases a connection per execution context
(`@leases[ActiveSupport::IsolatedExecutionState.context]`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:710-712`),
and a thread runs one statement at a time, so the unpinned adapter lock can be
`NullLock` (`abstract_adapter.rb:157,181-191`). In JS one async context can hold
many in-flight promises, so trails' adapter lock defaults to a real monitor
(CLAUDE.md § "The adapter lock defaults to a monitor, not `NullLock`"), and that
section currently rejects leasing per promise as having "no Ruby counterpart and
no JS hook to key on".

With a real lock, the Rails-shaped server-version barrier
(`pool_config.rb:39-40`, `connection_pool.rb:30-31`) deadlocks two arms,
measured 2026-09-25: a probe holding the adapter lock waits on the PoolConfig
monitor while `disconnect!` holds the monitor and waits on the adapter lock
(`pool-config.trails.test.ts`), and the NullPool mutex against the adapter lock
(`pool-server-version.trails.test.ts`).

The synchronous lease (`withConnectionSync` / `acquireConnectionSync`,
`abstract/connection-pool.ts:734,779`) is the adjacent open question, left
without a ruling in the same triage: it sits behind `new`, `where`, `arel`, the
sanitizers and `toSql`.

## Acceptance criteria

- A written design for leasing an adapter to one logical flow: what a flow is
  keyed on, how sibling promises under one async context are told apart, and
  what it costs per statement.
- The design says whether the adapter lock can return to `NullLock` under it,
  and CLAUDE.md § "The adapter lock defaults to a monitor" is updated to match
  whichever way it lands.
- The design states what it means for the synchronous lease, or says plainly
  that it leaves it alone.
- `server-version-barrier-takes-the-connection-lock-first` is re-cut against
  it.
