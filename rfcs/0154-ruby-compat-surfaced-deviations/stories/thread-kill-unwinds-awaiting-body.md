---
title: "thread-kill-unwinds-awaiting-body"
status: draft
updated: 2026-11-25
rfc: "0154-ruby-compat-surfaced-deviations"
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
closed-reason: null
---

## Context

`packages/activesupport/test/share-lock.test.ts:152` skips "killed thread loses lock"
(`vendor/rails/v8.0.5.2/activesupport/test/share_lock_test.rb`). The test kills a thread
that holds a share and asserts that the lock is released. ruby-compat's `Thread#kill`
(`packages/ruby-compat/lib/thread.ts`, `Thread#exit`) marks the thread dead, but it cannot
unwind a JS body that is awaiting a promise. So the killed thread's `ensure` never runs and
its share is never released. The skip carried a `PERMANENT-SKIP:` line with no CLAUDE.md
section or operator ruling behind it.

## Acceptance criteria

- [ ] Either `Thread#kill` runs the killed body's `ensure` (for example by rejecting the
      awaited promise the thread is parked on) and the test is ported, or the operator
      rules it permanent and CLAUDE.md records the ruling.
