---
title: "stub-const-awaits-an-async-block"
status: in-progress
updated: 2026-10-17
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: trails#9017
claim: "2026-10-17T23:43:45Z"
assignee: "stub-const-awaits-an-async-block"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Testing::ConstantStubbing#stub_const`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/constant_stubbing.rb:28-45`)
swaps the constant, `yield`s, and restores it in an `ensure` that runs when the
block returns. trails' `stubConst` (`packages/activesupport/src/testing/constant-stubbing.ts`)
restores in a synchronous `finally`: when the block is async (every block that
awaits a job enqueue, an association read, `assertDifference`), the `finally`
runs at the block's first `await` and the rest of the block sees the old value.

Surfaced by the codegen spike: activejob's
`enqueue_after_transaction_commit_test.rb` "#perform_later wait for transactions
to complete before enqueuing the job" stubs `Object::ActiveRecord` around
`assert_difference`, and `EnqueueAfterTransactionCommit#raw_enqueue` then reads
`ActiveRecord` after the stub was removed (`TypeError: Cannot read properties of
undefined (reading 'afterAllTransactionsCommit')`).

## Acceptance criteria

- `stubConst` restores the constant only after a thenable block settles (and
  returns the awaited value), keeping the sync path for a sync block.
- A regression test with an async block that reads the constant after an
  `await`, failing on the current implementation.
