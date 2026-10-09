---
title: "activerecord: two overlapping pin_connection! calls on a cold connection begin a transaction twice"
status: draft
updated: 2026-10-09
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8707 made `ConnectionPool#tryToCheckoutNewConnection` await `adoptConnection`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`; Rails
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:908-934`),
so a checkout that creates a connection takes more microtask ticks than before.

With that change the trails-only test "two concurrent contexts share the pool's single pinned
connection" (`packages/activerecord/src/connection-pool.trails.test.ts`) failed deterministically
on SQLite when its two `Thread`s called `pool.pinConnectionBang()` at the same time. The first
error was `SQLite3::SQLException: cannot start a transaction within a transaction`, raised from
`internalBeginTransaction` under `pinConnectionBang`'s `beginTransaction({ joinable: false, _lazy: false })`
on the shared pinned connection. The second context then failed in `unpinConnectionBang`'s
`resetBang` with `Safety level may not be changed inside a transaction`.

The cause was not confirmed. The unverified hypothesis: both contexts call `verifyBang` on the
same not-yet-connected pinned connection. `verifyBang`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`, Rails `verify!`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:759-776`)
reads `active?` outside `@lock`, so the second context can see "not active", wait for the lock,
and run `reconnect!(restore_transactions: true)` after the first context has already begun its
transaction. Rails has the same unlocked check; in trails every `await` is a yield point, so the
window is wider.

trails#8707 did not fix this. It rewrote the test so the second context pins only after the first
pin has finished, which no longer exercises two overlapping pins.

## Acceptance criteria

- [ ] The failure is reproduced with two overlapping `pinConnectionBang` calls on a cold pool and
      its cause is established (the `verifyBang` hypothesis above confirmed or replaced).
- [ ] The fix keeps `verify!`'s and `pin_connection!`'s Rails bodies; any added guard is the
      monitor CLAUDE.md § "The pool monitor guards only sections that span an `await`" allows.
- [ ] "two concurrent contexts share the pool's single pinned connection" starts both pins
      concurrently again and passes on every adapter lane.
