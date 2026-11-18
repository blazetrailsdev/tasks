---
title: "activesupport: receipt or port the 56 skips, wrong describes and mismatches"
status: ready
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: receipts
packages: [activesupport]
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

`parity:test` shows 56 skips. The stories listed in the RFC 0246 skip table
own 26 of them. This story owns the other 30:

| File                                                                                                                                                                                                           |  Skips |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| `cache/cache_store_setting_test.rb`                                                                                                                                                                            |      6 |
| `encrypted_configuration_test.rb`                                                                                                                                                                              |      5 |
| `cache/cache_store_logger_test.rb`                                                                                                                                                                             |      4 |
| `deprecation/proxy_wrappers_test.rb`                                                                                                                                                                           |      3 |
| `cache/stores/null_store_test.rb`                                                                                                                                                                              |      2 |
| `cache/cache_entry_test.rb`                                                                                                                                                                                    |      2 |
| `notifications_test.rb`                                                                                                                                                                                        |      2 |
| `cache/stores/file_store_test.rb`, `cache/stores/memory_store_test.rb`, `cache/behaviors/cache_store_behavior.rb`, `core_ext/enumerable_test.rb`, `log_subscriber_test.rb`, `isolated_execution_state_test.rb` | 1 each |

It also owns these structural rows:

- the 5 wrong-describe rows in `share-lock.test.ts` (`CustomAssertionsTest` is
  nested under `ShareLockTest` in Ruby)
- the 1 assertion-count and 3 assertion-kind mismatches
  (`pnpm parity:test:assertions`)
- the ✗ `concurrency/load_interlock_aware_monitor_test.rb` (0 tests matched;
  see `packages/activesupport/CLAUDE.md` § "A thread-owned lock is owned by
  the Fiber")

## Acceptance criteria

- [ ] Port each skip, or add a `PERMANENT-SKIP:` line that cites a CLAUDE.md
      section by name. If no section fits, list the skip in the PR for an
      operator ruling and leave it unchanged.
- [ ] `share_lock_test.rb` shows Desc 0, and `parity:test:assertions` shows
      no activesupport mismatch.
- [ ] No ✗ file is left for `load_interlock_aware_monitor_test.rb`.
- [ ] Split the work if it goes over the 500 LOC ceiling. The cache files and
      the rest are the natural halves.
