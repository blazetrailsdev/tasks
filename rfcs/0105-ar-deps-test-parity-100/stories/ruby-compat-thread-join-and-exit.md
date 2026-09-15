---
title: "Add Thread#join / #exit to ruby-compat and use them in the multi-threaded fallbacks port"
status: draft
updated: 2026-09-15
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/i18n/test/backend/fallbacks_test.rb:121-135` (`multi-threaded fallbacks`) calls `thread.join` and `ensure thread.exit`. trails#7773 ported it into `packages/i18n/src/backend/fallbacks.test.ts`, but `packages/ruby-compat/src/thread.ts` has neither method. The port calls `thread.value()` in place of `join` and drops `exit`.

Ruby core: `Thread#join` (`vendor/ruby/thread.c`, `rb_define_method(rb_cThread, "join", ...)`) returns the thread and re-raises its exception. `Thread#exit` / `kill` marks it dead.

## Acceptance criteria

- `Thread#join` and `Thread#exit` exist on ruby-compat `Thread`, each with a Ruby core receipt and direct tests in `thread.test.ts`. `join` returns `this` (awaitable when the block is async) and re-raises like `value`.
- The `multi-threaded fallbacks` port uses `thread.join()` and `ensure thread.exit()` verbatim.
