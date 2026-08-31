---
title: "port-cache-failure-safety-and-failure-raising-behaviors"
status: draft
updated: 2026-08-31
rfc: "0101-activesupport-out-of-closure-surface"
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

The RFC 0105 reconciliation of the out-of-closure activesupport remainder
(`reconcile-out-of-closure-activesupport-test-remainder`) found these two cache
behavior modules unowned by any RFC 0101 story.

- `vendor/rails/activesupport/test/cache/behaviors/failure_safety_behavior.rb:3`
  (`module FailureSafetyBehavior`, 139 lines) — **13 cases missing**.
- `vendor/rails/activesupport/test/cache/behaviors/failure_raising_behavior.rb:3`
  (`module FailureRaisingBehavior`, 140 lines) — **12 cases missing**.

Both are the "the backing store is unreachable" halves of the cache store
suite: `failure_safety_behavior.rb` asserts the store swallows the error and
reports it through `ActiveSupport::Cache::Store#handle_exception`, and
`failure_raising_behavior.rb` asserts the raising counterpart. Neither is
included by the two ported store tests today
(`packages/activesupport/src/cache/memory-store.test.ts`,
`file-store.test.ts`); Rails includes them from the network-backed store tests
(`cache/stores/redis_cache_store_test.rb`, `mem_cache_store_test.rb`), so the
port needs the behavior helper modules first, in the shape the landed ones use
(`packages/activesupport/src/cache/behaviors/`).

## Acceptance criteria

- `cache-failure-safety-behavior.ts` and `cache-failure-raising-behavior.ts`
  under `packages/activesupport/src/cache/behaviors/`, each a Rails-named
  helper mirroring the Ruby module case for case.
- Every case keeps its Rails test name verbatim.
- `pnpm parity:test --package activesupport` credits the 25 cases; deltas for
  every package non-negative.
- Split into more than one PR if the 700 LOC ceiling demands it — file the
  residue as a sibling story rather than exceeding it.
