---
title: "Reaper.ts's tick catches every reap()/flush() failure, not just the WeakRef::RefError analogue"
status: draft
updated: 2026-09-18
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while porting `ConnectionPool#reap` (story `port-connection-pool-reap-body`,
PR trails#7860).

Rails' reaper thread loop
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool/reaper.rb:44-58`):

```ruby
@pools[frequency].each do |p|
  p.reap
  p.flush
rescue WeakRef::RefError
end
```

rescues only `WeakRef::RefError` per pool; every other exception propagates
out of the `each`, out of the `while running` loop, and out of the thread
body. Ruby's default `Thread#report_on_exception` logs it, and only _that
one frequency's_ reaper thread dies — other frequencies' reaper threads, and
the rest of the process, are unaffected, and a later `register_pool` call for
that frequency spawns a fresh thread (`@threads[frequency]&.alive?` is now
false).

`Reaper._spawnTimer`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool/reaper.ts:58-113`)
currently catches every per-pool `reap()`/`flush()` failure, logs it via
`console.warn`, and keeps ticking — i.e. it rescues everything, not just the
`WeakRef::RefError` analogue (which, since a discarded/GC'd pool is filtered
out of `alive` _before_ this loop runs, has no reachable throw site here
anyway).

This is deliberately NOT the literal Rails shape. `setTimeout`/Promise-based
JS has no per-thread failure isolation the way Ruby's GVL-scheduled threads
do: an uncaught rejection from inside the tick's detached async IIFE
(`void (async () => {...})()`) is a process-wide unhandled rejection, which
crashes the whole Node process by default (Node 15+). That is a strictly
worse outcome than Rails' — one frequency's reaper dying, isolated from every
other thread — and it was observed directly while testing this: an
intentionally-thrown `reap()` failure aborted the entire vitest process, not
just the one test.

## Converged shape

The real gap against Rails is not "don't catch anything" (unachievable
safely in JS with the tools this repo has — no worker-thread/isolate
boundary per frequency) but the loop's _scope of continuation_ after a
failure: Rails only continues past the specific pool that failed within the
`each`'s current pass and otherwise resumes on the next `sleep t` cycle
regardless (nothing in Rails' loop stops FUTURE cycles for reasons other than
the pool list going empty), which trails already matches by always calling
`scheduleNext()`. What's missing is a way to surface a genuine, non-RefError
failure as loudly as Rails does (a logged, unhandled-exception-shaped
signal) without using a `process.on(...)` hook (hard rule: no `process.*`
references) or risking a process-wide crash.

One option: register the failure as a rejection on a promise nothing awaits
but that IS surfaced through this package's own error-reporting seam (if one
exists) rather than `console.warn`, so it reaches whatever channel a real
Rails app's `Thread#report_on_exception` output would reach (STDERR via a
supervisor, structured logging, etc.) instead of being a plain warning.
Investigate whether such a seam exists in `ar-config.ts` /
`ActiveSupport::Notifications` before inventing one.

## Acceptance criteria

- A `reap()`/`flush()` failure for one pool is reported through this
  package's standard error/notification path (not just `console.warn`), one
  level closer to Rails' `Thread#report_on_exception` visibility, while the
  reaper keeps ticking for every other pool and future cycles.
- `reaper.trails.test.ts`'s "keeps ticking after a reap() failure" test is
  updated to assert against the converged reporting path.
- No `process.*` reference is introduced (hard rule).
