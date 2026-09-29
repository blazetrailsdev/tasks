---
title: "Port EnqueueAfterTransactionCommit over a TopLevel.ActiveRecord seat"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob", "activerecord", "activesupport"]
deps: ["port-activejob-enqueuing-execution-and-inline-adapter"]
deps-rfc: []
est-loc: 300
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/enqueue_after_transaction_commit.rb`
(44 lines) overrides the private `raw_enqueue` (`:6-42`). It reads
`self.class.enqueue_after_transaction_commit`. The deprecated `:always`,
`:never` and `:default` arms (`:10-27`) each warn through
`ActiveJob.deprecator` with Rails' `squish`ed message, and under CLAUDE.md's
Symbol rule they are the strings `":always"`, `":never"` and `":default"`. When
deferring (`:32-38`), it sets `successfully_enqueued = true`, calls
`ActiveRecord.after_all_transactions_commit { self.successfully_enqueued =
false; super }`, and returns `self`. Otherwise it calls `super`. It is
included into `Base` by the railtie's `on_load(:active_record)` hook
(`railtie.rb:28-53`), and in tests by `test/helper.rb:27`.

**`ActiveRecord` is resolved at call time, through `TopLevel`** (RFC "Package
shape"). activejob has no activerecord dependency, and the Rails test replaces
the constant with a fake:
`stub_const(Object, :ActiveRecord, fake_active_record, exists: false)`
(`test/cases/enqueue_after_transaction_commit_test.rb:60,69,78,92`). So:

- activesupport: add `ActiveRecord?: { afterAllTransactionsCommit(block: () =>
unknown): unknown }` to `TopLevel`'s type
  (`packages/activesupport/src/namespaces.ts:30-58`), beside `Trails` and
  `ActionDispatch`.
- activerecord: seat `TopLevel.ActiveRecord` with the object that answers
  `afterAllTransactionsCommit` (`packages/activerecord/src/active-record.ts:455`).
  Per CLAUDE.md § "Call-time constant resolution", that is the `ActiveRecord`
  module whose singleton methods live in `active-record.ts`.
- activejob reads `TopLevel.ActiveRecord!.afterAllTransactionsCommit(…)` with
  no guard. Rails has no `defined?` here.
- The test stubs it with activesupport's `stubConst(TopLevel, "ActiveRecord",
fake, block, { exists: false })`
  (`packages/activesupport/src/testing/constant-stubbing.ts:3`). The Rails
  bodies are async, so check that `stubConst` restores on the block's settle
  and not on its return. If it restores on return, converge it here, the same
  way `useZone` was converged.

The deferred `super` is awaited inside the commit callback. trails'
`afterAllTransactionsCommit` already accepts `() => void | Promise<void>`.

Tests: `test/cases/enqueue_after_transaction_commit_test.rb`, all 4 (101
lines), with its `FakeActiveRecord` (`:7-29`) and the `enqueue_error_job`
fixture.

## Acceptance criteria

- [ ] `enqueue_after_transaction_commit.rb` reads complete in `parity:api`.
- [ ] `packages/activejob/package.json` still has no activerecord dependency.
- [ ] The 4 cases pass in all three lanes.
- [ ] A `.trails.test.ts` in activerecord shows a job enqueued inside a real
      transaction on a canonical model enqueues only after commit.

## Definition of done

Importing `@blazetrails/activerecord` into activejob does not close this story, and neither does a `TopLevel.ActiveRecord?.` guard that Rails does not have.
