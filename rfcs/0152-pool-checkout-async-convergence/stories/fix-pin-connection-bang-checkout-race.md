---
title: "fix-pin-connection-bang-checkout-race"
status: closed
updated: 2026-09-23
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Delivered by trails#7861 (merged 2026-09-18, bbb3dcc5a5 'pinConnectionBang no longer races a concurrent checkout'). origin/main connection-pool.ts:436-444 re-checks _pinnedConnection after 'await this.checkout()' and checkin()s the loser; connection-pool.trails.test.ts:790 'two concurrent contexts share the pool's single pinned connection' is an active it(), no longer skipped."
---

## Context

Found while porting `ConnectionPool#reap`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`,
story `port-connection-pool-reap-body`, PR trails#7860).

Rails' `pin_connection!`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:325-327`)
assigns with a bare `@pinned_connection ||= (connection_lease&.connection || checkout)`,
safe because nothing yields between the nil-check and the assignment.

`pinConnectionBang` (`connection-pool.ts`) ports this as
`this._pinnedConnection ??= this.connectionLease().connection ?? (await this.checkout())`.
`await this.checkout()` always yields at least one microtask (JS has no
synchronous await), so two concurrent pinners can both observe
`_pinnedConnection` unset and both check out a connection; whichever
assignment lands second silently clobbers the first's, orphaning a
checked-out, mid-transaction connection that nothing ever checks back in.

This was latent and untested before `reap()` did real work: with `reap()`
now sweeping for in-use connections whose owner thread has died, it finds
the orphan, sees it's no longer owned by a live thread, and calls
`resetBang()` on it while its transaction is still open, which throws
(`Safety level may not be changed inside a transaction`, better-sqlite3).

The regression is covered by the existing (currently skipped)
`packages/activerecord/src/connection-pool.trails.test.ts` test
`"two concurrent contexts share the pool's single pinned connection"`.

A working fix (re-check `_pinnedConnection` after the `await` and check the
loser's connection back in with `checkin`) was prototyped and verified
against this test in PR trails#7860, then backed out of that PR at
reviewer request to keep the `reap` port single-purpose. The fix itself:

```ts
async pinConnectionBang(lockThread = false): Promise<void> {
  if (!this._pinnedConnection) {
    const acquired = this.connectionLease().connection ?? (await this.checkout());
    if (this._pinnedConnection) {
      this.checkin(acquired);
    } else {
      this._pinnedConnection = acquired;
    }
  }
  ...
```

## Acceptance criteria

- `pinConnectionBang` no longer races: two concurrent contexts calling it
  concurrently on an empty `_pinnedConnection` end up sharing exactly one
  pinned connection, and the loser's checked-out connection is returned to
  the pool rather than orphaned.
- Un-skip `"two concurrent contexts share the pool's single pinned
connection"` in `connection-pool.trails.test.ts` and it passes.
- Cite `connection_pool.rb:325-327` and explain the async-always-yields gap
  at the fix site (or in this repo's connection-pool fidelity doc section)
  per this repo's language-shortcoming convention.
