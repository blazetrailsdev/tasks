---
title: "Restore mutex critical sections that trails drops across an await (adapter/pool lifecycle)"
status: done
updated: 2026-08-09
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 280
priority: null
pr: 6277
claim: "2026-08-09T12:53:07Z"
assignee: "mysql-ddl-implicit-commit-escapes-the-fixture-transaction-pin"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `parity:api:calls` triage audit of 2026-08-08 and its follow-up review.

The 32 activerecord baseline rows for the Ruby call `synchronize` were about to
be bulk-cleared with the cluster-vetted reason already in the tree:

> Ruby guards the body with `Mutex#synchronize`; trails is single-threaded and
> has no mutex, so the port has no analogue call.

That reason conflates **single-threaded** with **non-interleaving**. JS's
run-to-completion model does give a mutex's guarantee to a body with no yield
point — but not to one that `await`s. Every `await` is a scheduling point at
which another task may enter the same method. For ~10 of the 32, Rails holds
the lock across exactly the operation trails awaits, so the mutex is an
**unported concurrency guarantee**, not an absent analogue, and the row is a
real fidelity gap rather than tooling noise.

### The clearest case

`abstract_adapter.rb:662-676` (`reconnect!`) and `:757-775` (`verify!`) hold
`@lock` across `reconnect` / `attempt_configure_connection` — genuinely blocking
I/O, which is _why_ the lock is there. trails awaits at precisely those points:

- `connection-adapters/abstract-adapter.ts:1271-1290` (`reconnectBang`) —
  `await this.reconnect()` (1277), then `await this.resetTransaction(…)` (1284)
  whose callback awaits `clearCacheBang()` and `attemptConfigureConnection()`.
- `connection-adapters/abstract-adapter.ts:1364-1380` (`verifyBang`) — three
  awaits, including `attemptConfigureConnection()` (1374) between reading
  `this._unconfiguredConnection` and nulling it, and `reconnectBang(…)` (1379).

Two concurrent `verifyBang()` calls therefore interleave: both observe
`!active()`, both take the reconnect path, and both race `_unconfiguredConnection`
to null — a double reconnect and a dropped handle. Rails' `@lock` makes that
sequence impossible.

### Membership (verify before acting; the tail was classified, not all read)

Read and confirmed:

- `abstract-adapter.ts` — `reconnectBang`, `verifyBang` (above).
- `postgresql-adapter.ts:1244-1246` — `reloadTypeMap` sets `this._typeMap = null`
  then `await this.loadAdditionalTypes()`, leaving the type map null across a
  yield; Rails wraps the whole body in `@lock.synchronize`
  (`postgresql_adapter.rb:349-372`).

Classified by body shape, not individually read — confirm each:
`mysql2-adapter.ts` `disconnectBang` / `reconnect` (`mysql2_adapter.rb:110-151`),
`postgresql-adapter.ts#resetBang`, `connection-pool.ts#unpinConnectionBang`
(awaits inside the try while pin state is half-torn-down),
`pool-config.ts#disconnectBang`, `migration.ts#call` (`migration.rb:657`,
`@mutex.synchronize`).

Explicitly **not** in scope — the other 22 rows, which are genuinely
justified and belong to the reason-text route (see
`0092-parity-tools-consolidation/set-reason-bulk-mode`, addendum 2):

- 18 sync bodies with no yield point (run-to-completion covers them). Four of
  those, in `queue.ts`, converge instead by wiring up the faithful pass-through
  `synchronize` already sitting dead at `queue.ts:358`.
- ~4 async wrappers over a synchronous core — `flush` / `discardBang` /
  `clearReloadableConnections` (`connection-pool.ts:1145, 1019, 1079`) and
  `discard_pool!` — shaped `await Promise.all(this._syncCore())`, where the
  state mutation is atomic and the awaits are only driver-close drains after it.

### The primitive already exists

`connection-adapters/abstract/transaction.ts:1199-1206` implements the
promise-chain lock this needs — await the current `_lockChain`, install a new
one, release in a `finally`. It is the trails-native analogue of
`Mutex#synchronize` for an async body, and reusing it keeps the Rails name and
block shape at each call site, which is what CLAUDE.md's "converge the shape as
far as the language allows" asks for. Do **not** invent a second lock shape.

### Why this is not a baseline row

Per CLAUDE.md, a documented deviation is debt, not permission, and "only a
genuine TypeScript language shortcoming" ratifies one. Absence of OS threads is
such a shortcoming; absence of _mutual exclusion across an await_ is not — JS
expresses it fine, and this repo already does, one directory away. A row here
would be a reason that reads as an equivalence while describing a missing
guarantee, which is worse than no row: it tells the next reader the question is
settled.

## Acceptance criteria

- Each candidate above confirmed or excluded by reading the Rails body and the
  TS body, and the finding recorded per method — the tail was classified by
  shape, and a method whose awaits all sit outside the protected state belongs
  in Tier 2, not here.
- For each confirmed member, the critical section is restored using the existing
  promise-chain lock pattern (`transaction.ts:1199-1206`), factored to one
  shared helper rather than copied; the Rails method keeps its name and its
  block-shaped body.
- A regression test per distinct hazard that **fails on the baseline**: two
  concurrent `verifyBang()` calls must produce exactly one reconnect; two
  concurrent `reloadTypeMap()` calls must never expose a null `_typeMap` to a
  reader. Assert the interleaving, not just the end state.
- Rows converged out of `call-mismatches-exclude/` are dropped by hand (one row
  per converged call, never a `--write` reseed of the whole tree), and
  `pnpm parity:api:calls` ends green with zero mark slack — the marks are currently
  flush at 1,904, so a reseed is required for the mark shards even when the
  baseline edit is by hand.
- No row from the 22 excluded above is touched by this PR.
- If the work exceeds the PR ceiling, ship the adapter-lifecycle half
  (`reconnectBang` / `verifyBang` / `reloadTypeMap`) and file the pool half
  rather than fanning out.
