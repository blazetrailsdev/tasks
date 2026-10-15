---
title: "Thread#kill runs the killed body's pending ensure"
status: draft
updated: 2026-10-15
rfc: "0154-ruby-compat-surfaced-deviations"
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

ruby-compat's `Thread#kill` / `#exit` (`packages/ruby-compat/src/thread.ts`)
marks the thread dead and settles `join`, but cannot unwind a body awaiting a
promise, so the body's `ensure` never runs. Ruby's `Thread#kill`
(`vendor/ruby/v3.3.11/thread.c:5403`, `rb_thread_kill`) raises a fatal into the
target thread, which runs its `ensure` blocks.

Two `share_lock_test.rb` tests depend on it
(`packages/activesupport/src/share-lock.test.ts`, trails#8943):

- `test_killed_thread_loses_lock` (`vendor/rails/v8.0.2/activesupport/test/share_lock_test.rb:94`)
  is `it.skip` with `PERMANENT-SKIP`.
- `test_exclusive_conflicting_purpose` (`:115-179`) runs its passes
  `[false, true]` where Rails runs `[true, false]` (`:116`), because the `true`
  pass's leftover shares are freed only by `kill` in its `ensure` (`:176-177`).

## Acceptance criteria

- A killed ruby-compat `Thread` runs its pending `ensure` (e.g. by rejecting the
  awaited promise it is parked on), so `ShareLock` shares are released.
- `killed thread loses lock` runs un-skipped; `exclusive conflicting purpose`
  iterates `[true, false]` as Rails does.
