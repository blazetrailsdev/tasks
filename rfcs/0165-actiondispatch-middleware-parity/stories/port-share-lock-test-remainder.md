---
title: "port-share-lock-test-remainder"
status: in-progress
updated: 2026-10-15
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8943
claim: "2026-10-15T18:28:26Z"
assignee: "port-share-lock-test-remainder"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Concurrency::ShareLock` is ported at
`packages/activesupport/src/concurrency/share-lock.ts` (trails#8943), over a
reentrant ruby-compat monitor (`monSynchronize` / `MonitorConditionVariable`
in `packages/ruby-compat/src/monitor.ts`). `share-lock.test.ts` ports the first
seven tests of `vendor/rails/v8.0.2/activesupport/test/share_lock_test.rb`
(`:12-76`) and the `CustomAssertions` helpers (`:490-512`), plus
`with_thread_waiting_in_lock_section` (`:558-575`).

Still unported: `test_exclusive_matching_purpose` (`:78`),
`test_killed_thread_loses_lock` (`:94`), `test_exclusive_conflicting_purpose`
(`:115`), `test_exclusive_ordering` (`:182`),
`test_new_share_attempts_block_on_waiting_exclusive` (`:218`),
`test_share_remains_reentrant_ignoring_a_waiting_exclusive` (`:244`),
`test_compatible_exclusives_cooperate_to_both_proceed` (`:273`), the five
`test_manual_*yield*` tests (`:290-455`),
`test_in_shared_section_incompatible_non_upgrading_threads_cannot_preempt_upgrading_threads`
(`:457`) and `CustomAssertionsTest` (`:514-555`).

## Acceptance criteria

- Each listed test is ported into `share-lock.test.ts` under its Rails name.
- `pnpm parity:test --package activesupport` reports `share_lock_test.rb` fully matched.
