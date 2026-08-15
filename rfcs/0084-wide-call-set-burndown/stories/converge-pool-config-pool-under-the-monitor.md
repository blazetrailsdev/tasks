---
title: "Decide whether PoolConfig#pool needs the ported monitor at all"
status: done
updated: 2026-08-15
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6552
claim: "2026-08-14T23:45:08Z"
assignee: "record-ratified-proc-call-reason"
blocked-by: null
closed-reason: null
---

# Decide whether PoolConfig#pool needs the ported monitor at all

## Context

Split out of `converge-pool-config-pool-and-server-version-under-the-monitor`
(RFC 0084). The `#serverVersion` half landed and now mirrors
`pool_config.rb:39-41` including the `synchronize` block. `#pool` does not, and
this story originally asked for the same treatment.

Rails:

```ruby
def pool
  @pool || synchronize { @pool ||= ConnectionAdapters::ConnectionPool.new(self) }
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/pool_config.rb:70-72`)

trails (`packages/activerecord/src/connection-adapters/pool-config.ts:192-197`)
does the read-check-write with no lock, under a JSDoc finding that argues the
lock is unnecessary here.

**Investigating the original ask turned up a reason to question the ask
itself**, which is why this story has been rewritten from "add the lock" to
"decide whether the lock belongs." Both halves of the evidence are below.

### Why converging as written is expensive

Measured by making the flip and running `pnpm typecheck` at each frontier:

1. `PoolConfig#pool` → `async pool()`: 6 non-test callers, all in
   `connection-adapters/abstract/connection-handler.ts` (`connectionPoolList`,
   `eachConnectionPool`, `establishConnection` ×2, `retrieveConnectionPool`).
2. Making those four async: 21 non-test errors, the load-bearing one being
   `connectionPool()` in `connection-handling.ts:459`.
3. Making `connectionPool()` async: 58 non-test errors across 17 files, and the
   frontier does not terminate at a Rails-async boundary. It lands on methods
   Rails defines as **synchronous**:

- `Model.quotedTableName` (`model-schema.ts:645`). Rails: `quoted_table_name` →
  `adapter_class` → `connection_pool` (`model_schema.rb:283-286`,
  `connection_handling.rb:338-340`), all sync. trails routes it through
  `reflectionAdapter` (`model-schema.ts:39-45`), which reads
  `connectionPool.call(klass)`. `quotedTableName` is called synchronously from
  Arel/SQL construction.
- `Relation#aliasTracker` (`relation.ts:6318`). Rails:
  `alias_tracker(joins = [], aliases = nil)` →
  `AliasTracker.create(model.connection_pool, ...)` (`relation.rb:1307-1309`),
  sync, called from sync join construction.

Same shape hits `adapterClassSync` (`connection-handling.ts:545`),
`cachedTableExists` (`model-schema.ts:1559`, documented as sync-only precisely
because `tableExists` is async), and the `leaseConnectionSync()` readers in
`model-schema.ts:44` / `base.ts:5080` / `tasks/database-tasks.ts:1382`.

So the cost of converging the `synchronize` is making three Rails-synchronous
methods return promises — three real fidelity regressions to remove one.

### Why the lock may be buying nothing here

What sits inside Rails' critical section is a single **pure constructor**.
`ConnectionPool`'s constructor (`connection-pool.ts:435-451`) assigns fields and
calls `buildAsyncExecutor()` and `new Reaper(...).run()`; it opens no connection
and performs no I/O.

In Ruby the monitor is load-bearing because threads preempt: two threads can
interleave between the `@pool` read and the `@pool =` write and build two pools.
In JavaScript a function body containing no `await` runs to completion and
**cannot** be interleaved — and a constructor can never be `async`, so this is a
language-level guarantee rather than a property of the current body that a later
edit could quietly break.

The contrast with this class's siblings is the tell. `#serverVersion`
(`pool-config.ts:160`) and `#disconnectBang` (:214) both take the monitor, and
both contain real `await`s (`getDatabaseVersion`, `disconnectBang`). The JSDoc
on `#disconnectBang` (:208-212) states the reason explicitly — "`disconnectBang()`
is a real suspension point, so without the lock two concurrent callers
interleave." That reasoning does not transfer to `#pool`.

The existing JSDoc on `get pool()` (:181-190) already makes this argument. This
story was filed to overturn a reasoned finding, and should not do so without
engaging it.

### Rejected alternative: warm the pool asynchronously

Considered and does not work — recorded so it is not re-derived. The idea was to
create the pool through an async path ahead of time so the sync readers could go
on reading a memoized `@pool`, sidestepping the cascade above.

- The natural warm point is `establishConnection`, which is **synchronous** in
  trails (`connection-handler.ts:156`) and in Rails
  (`connection_handler.rb:115`). The other five callers are sync too. There is
  no async seam in the lifecycle to hang a warm on.
- A `warmPool()` would therefore be invented surface with no Ruby counterpart,
  plus an unenforceable ordering contract ("await this before any sync `.pool`
  read") that Rails imposes on nobody.
- The invariant does not hold regardless: `_discardPoolBangSync`
  (`pool-config.ts:255-261`) sets `_pool = null` synchronously, so a warmed
  config can be un-warmed mid-flight and the next sync reader is cold — where
  Rails simply builds a new pool. Fork handling and `clearAllConnections` reach
  that path routinely.

A synchronous fast-path _through_ the monitor is separately rejected, and for a
different reason: it would let a sync `#pool` reader walk into the critical
section while `#disconnectBang`/`#discardPoolBang` hold the lock across a real
suspension point. Ruby blocks there; we would not.

## The decision — RULED: Option B (parity owner, 2026-08-14)

**Option B is ratified. `get pool()` stays synchronous and unlocked.** The
escalated judgement — whether a JS language _guarantee_ that makes the Ruby
construct vacuous counts as a ratifiable language shortcoming — is answered
yes, for this critical section specifically: it is a pure constructor with no
suspension point, and a constructor can never be `async`, so the mutual
exclusion Ruby's monitor buys is provided by the execution model rather than
omitted. This is a ratification, not a deferral, and it does not generalise —
it licenses nothing about `#serverVersion` or `#disconnectBang`, both of which
contain real `await`s and keep their `synchronize`.

The story is now ordinary code work: implement the Option B arm below. Do not
re-open the A/B question.

The two options as they were escalated, kept for the record:

**Option A — converge as originally specified.** Add the `synchronize` block,
absorb the await through all ~105 sync call sites, and accept that
`quotedTableName`, `aliasTracker` and `adapterClassSync` become
promise-returning where Rails has them sync. Faithful at `pool_config.rb:70-72`;
three new divergences elsewhere, each of which would itself be a fidelity story.

**Option B — ratify the omission on the run-to-completion argument.** Keep
`get pool()` synchronous and unlocked. The claim is not "cleaner in TS" but that
the Ruby construct's _semantics_ — mutual exclusion over the critical section —
are already guaranteed by the JS execution model for a body with no suspension
point, which is the same category of language-level reasoning already accepted
for the zero-import slot modules in CLAUDE.md.

Option B is what CLAUDE.md's deviation-register section is pointed about:
"a deviation-convergence story always converges," and only "a genuine TypeScript
language shortcoming is ratifiable." Whether a language _guarantee_ that makes
the Ruby construct vacuous falls in that category was the judgement escalated,
and it has now been answered in Option B's favour above.

## Acceptance criteria

Option A is closed out by the ruling; only the B arm remains.

- [x] A parity owner records the decision in this story before any code changes
      — Option B, 2026-08-14, recorded in `## The decision` above.
- [ ] The JSDoc on `get pool()` (`packages/activerecord/src/connection-adapters/pool-config.ts:181-190`)
      is **rewritten**, not merely kept: it cites `pool_config.rb:70-72` as the
      Rails counterpart, states the no-`await`-in-a-constructor guarantee as the
      reason the `synchronize` is vacuous here, and records the 2026-08-14
      sign-off with this story's id so the finding is traceable to a decision
      rather than to an agent's judgement.
- [ ] The JSDoc explicitly scopes the ratification to this method, contrasting
      with `#serverVersion` (:160) and `#disconnectBang` (:214), which keep the
      monitor because they contain real suspension points — so a later reader
      does not generalise the exemption across the class.
- [ ] A regression test pins that the critical section stays suspension-free: a
      later edit introducing an `await` between the `@pool` read and the `@pool =`
      write must fail the suite rather than silently reintroduce the race.
      Assert on the shape of the getter (e.g. that it is not an async function
      and its source between read and write contains no `await`), not on timing
      — a timing test cannot observe a race that the execution model prevents.
- [ ] The call-set baseline row for `pool_config.rb`'s `synchronize` carries the
      reviewed reason pointing at this ruling, replacing any seeded placeholder.
      Row count does not grow; no allowlist is widened.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.

## Notes

- The prior `blocked-by` framed this as downstream of the RFC 0023 pool
  async-surface convergence. That framing assumes Option A. Under Option B there
  is no such dependency, which is part of why the decision is worth taking
  explicitly rather than deferring behind another RFC.
- The story's previous claim (assignee
  `converge-pool-config-pool-under-the-monitor`, 2026-08-12) was cleared as part
  of this rewrite; that agent is no longer running and left no branch.
