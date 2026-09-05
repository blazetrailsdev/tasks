---
title: "AbstractAdapter's lock defaults to the monitor where Rails installs NullLock"
status: blocked
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: "2026-09-05T18:26:52Z"
assignee: "attribute-set-envelope-loses-unregistered-type-keys"
blocked-by: "Converging the default to NullLock (abstract_adapter.rb:157) breaks a real trails correctness invariant that Rails gets for free from exclusive thread-leasing. Beyond the three abstract-adapter.lifecycle.trails.test.ts serialization cases named in the story, packages/activerecord/src/connection-adapters/postgresql-adapter.exec-query.trails.test.ts:322 'reads currval on the session that ran its own INSERT' fails: with the monitor gone, two concurrent execInsert calls on one adapter interleave their INSERT and their currval probe, so the second insert's id is read for the first. Rails' non-returning exec_insert (postgresql/database_statements.rb:45-61) issues those as two separate unlocked statements and is safe only because the connection is leased to one thread. Unblocking needs the pool to prevent concurrent entry on a leased connection — see synchronize-lock-barges-in-the-release-window and converge-acquire-connection-blocking-wait — not an adapter-level change."
closed-reason: null
---

## Context

Rails installs `NullLock` on every connection that is not pinned. `AbstractAdapter#initialize`
ends with `self.lock_thread = nil`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:157`),
and the setter's `else` arm is `ActiveSupport::Concurrency::NullLock` (`:181-192`):

```ruby
def lock_thread=(lock_thread) # :nodoc:
  @lock =
  case lock_thread
  when Thread then ActiveSupport::Concurrency::ThreadLoadInterlockAwareMonitor.new
  when Fiber  then ActiveSupport::Concurrency::LoadInterlockAwareMonitor.new
  else             ActiveSupport::Concurrency::NullLock
  end
end
```

So in Rails an unpinned connection takes the null lock, and `@lock.synchronize` in
`with_raw_connection` (`:984`), `reconnect!` (`:666`) and `verify!` (`:701`) is a
no-op. That is safe there because a Ruby connection is leased to one thread at a
time.

PR #7257 ported `setLockThread` with all three arms
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`), and
`pinConnectionBang`/`unpinConnectionBang` drive it as `connection_pool.rb:335`
and `:358` do. It did **not** port `initialize`'s `self.lock_thread = nil`: the
`lock` field initializer stays `new LoadInterlockAwareMonitor()`.

The reason is that trails' critical sections are `await`ed, so a single
execution context can re-enter them concurrently where a Ruby thread cannot.
Flipping the default to `NullLock` turned three existing trails tests red —
`abstract-adapter.lifecycle.trails.test.ts`'s "withRawConnection serializes
concurrent calls and yields the connection", "reconnectBang serializes
concurrent callers" and "verifyBang serializes concurrent callers and promotes
the unconfigured connection once" — which pin that serialization as required
behaviour.

This deviation carries **no register entry**: not a baseline row, not a
`@noRailsEquivalent`, not a `@missingRailsCall`. A `@missingRailsCall
lock_thread=` receipt on the constructor was tried and went STALE (the call gate
does not flag that call), and `blazetrails/no-freeform-comments` reduces a
receipt to its bare permanence token, so the reason cannot live in a tag either.
It is currently recorded only in #7257's description, which is why it needs a
story.

Note `unpinConnectionBang` DOES call `setLockThread(null)` (`connection_pool.rb:358`),
so a connection that has been pinned once does end up on `NullLock` for its
later leases — the default and the unpin path currently disagree, which is its
own reason to settle this.

## Converged shape

`AbstractAdapter`'s constructor calls `setLockThread(null)` as
`abstract_adapter.rb:157` does, leaving an unpinned connection on `NullLock`.

That requires establishing why trails needs serialization where Rails does not.
Either the three lifecycle tests encode a real trails invariant — in which case
the pool, not the adapter, should be preventing concurrent entry on one leased
connection, and the monitor is papering over a leasing gap — or they encode a
trails-invented guarantee and should be retired with the monitor. Settle which,
then converge. Related: `synchronize-lock-barges-in-the-release-window` and
`converge-acquire-connection-blocking-wait` (both RFC 0119) are about the same
locking surface.

## Acceptance criteria

- [ ] `AbstractAdapter`'s constructor installs the lock through
      `setLockThread(null)`, matching `abstract_adapter.rb:157`.
- [ ] An unpinned connection's `lock` is `NullLock`, so the `else` arm at
      `:181-192` is reachable from the default path and not only from unpin.
- [ ] The three `abstract-adapter.lifecycle.trails.test.ts` serialization cases
      are either satisfied without the adapter-level monitor, or retired with a
      recorded reason.
- [ ] All three lanes green.
