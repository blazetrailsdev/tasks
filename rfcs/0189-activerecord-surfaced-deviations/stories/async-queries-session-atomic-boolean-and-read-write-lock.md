---
title: "activerecord: AsynchronousQueriesTracker::Session holds an AtomicBoolean and a ReadWriteLock, and finalize(wait) waits for readers"
status: draft
updated: 2026-10-16
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
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

`ActiveRecord::AsynchronousQueriesTracker::Session`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/asynchronous_queries_tracker.rb:8-28`):

```ruby
def initialize
  @active = Concurrent::AtomicBoolean.new(true)
  @lock = Concurrent::ReadWriteLock.new
end

def active?
  @active.true?
end

def synchronize(&block)
  @lock.with_read_lock(&block)
end

def finalize(wait = false)
  @active.make_false
  if wait
    # Wait until all thread with a read lock are done
    @lock.with_write_lock { }
  end
end
```

The trails port (`packages/activerecord/src/asynchronous-queries-tracker.ts`, `class Session`) holds a bare `#active = true`, has `synchronize(block) { return block(); }`, spells the predicate `active()`, and its `finalize(_wait = false)` never reads `wait`. So `finalize_session(wait: true)` (`:60`) returns while a `FutureResult` scheduled inside `session.synchronize` (`future_result.rb:103`, `future-result.ts:186`) is still running. The block there is async, so a read lock that spans its `await` has real work to do.

ruby-compat has `Concurrent::Map`, `CountDownLatch`, `CyclicBarrier` and `Event` in `packages/ruby-compat/src/concurrent/`, and no `AtomicBoolean` or `ReadWriteLock`.

## Acceptance criteria

- [ ] ruby-compat ports `Concurrent::AtomicBoolean` (`true?`, `false?`, `make_true`, `make_false`, `value`) and `Concurrent::ReadWriteLock` (`with_read_lock`, `with_write_lock`, with a write lock waiting for every held read lock, including one held across an `await`), each with a concurrent-ruby source citation, unit tests and a README row.
- [ ] `Session` constructs both at the Rails sites. `synchronize` is `with_read_lock`. `finalize(wait)` calls `make_false` and, when `wait`, awaits `with_write_lock` on an empty block. The tracker's `finalizeSession` awaits it where it passes `wait`.
- [ ] `active?` is answered by `isActive` (predicate rule, `pnpm parity:api:predicates`), and `future-result.ts`'s two callers use it.
- [ ] A regression test, failing on main, shows `finalizeSession(true)` does not resolve until a scheduled query's `synchronize` block finishes.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:predicates && pnpm vitest run packages/activerecord/src/asynchronous-queries.test.ts packages/activerecord/src/future-result.trails.test.ts packages/ruby-compat/src/concurrent/
```
