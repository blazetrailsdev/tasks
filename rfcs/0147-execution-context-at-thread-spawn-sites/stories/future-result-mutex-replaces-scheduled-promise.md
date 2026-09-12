---
title: "FutureResult ports @mutex; drop the #scheduled Thread.pass stand-in"
status: blocked
updated: 2026-09-12
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#7722
claim: "2026-09-11T20:20:31Z"
assignee: "future-result-mutex-replaces-scheduled-promise"
blocked-by: "Rails' ordering comes from Thread.pass blocking the caller (connection_pool.rb:698) while the executor thread reaches @mutex.try_lock (future_result.rb:107). JS has no blocking wait, and the executor's path to try_lock spans an async checkout with real I/O, so no yield at the Rails site is long enough: with Thread.pass() as one macrotask, LoadAsyncTest > notification forwarding still reported payload.async == false on PostgreSQL in CI (run 34647598794). Awaiting the scheduled task at the call site also changes select_all's scheduled arm from returning the FutureResult to returning a Promise, reddening future-result.trails.test.ts:244 and relation-load-async.trails.test.ts:92,114,136,260. The only mechanism that orders it is the #scheduled in-flight field this story exists to delete. Needs a design that gives the executor the mutex before the foreground without a stand-in field."
closed-reason: null
---

## Context

trails#7716 added a private `#scheduled` field to `FutureResult`
(`packages/activerecord/src/future-result.ts:140,184,223`). `executeOrSkip`
stores its in-flight `session.synchronize` promise there, and `executeOrWait`
awaits it before checking `#executing`. The field stands in for the
`Thread.pass` in `schedule_query`
(`activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:696-698`):
without it, a fresh-lease checkout lets the foreground `result()` claim the
query first, and `LoadAsyncTest > notification forwarding` gets
`payload.async == false`.

Rails has no such field. `FutureResult` holds `@mutex = Mutex.new`
(`future_result.rb:58`). `execute_or_skip` does `return unless @mutex.try_lock`
inside `with_connection` (`future_result.rb:106-117`). `execute_or_wait` does
`@mutex.synchronize { if pending? ... else @lock_wait = ... }`
(`future_result.rb:144-159`). trails models `try_lock` with `#executing` instead
of a mutex.

## Converged shape

- Port `@mutex` as ruby-compat `Mutex`, adding `tryLock` (`thread_sync.c`
  `rb_mutex_trylock`) if it is missing. `executeOrSkip` and `executeOrWait` then
  follow Rails line for line, and `#executing` and `#scheduled` are deleted.
- Supply the `Thread.pass` ordering at its Rails site. Either `scheduleQuery`
  yields the way `connection_pool.rb:698` does, or the executor takes `@mutex`
  before the foreground can. If neither is expressible, block the story with
  the specific language limit.

## Acceptance criteria

- [ ] `#scheduled` and `#executing` are gone; `FutureResult` has `@mutex` and the Rails bodies of `execute_or_skip` and `execute_or_wait`.
- [ ] `LoadAsyncTest > notification forwarding` stays green on all adapters.
- [ ] `parity:api:calls` is not raised for `future-result.ts`.
