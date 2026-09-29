---
title: "Port EnqueueAfterTransactionCommit over a TopLevel.ActiveRecord seat, with its test"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob", "activerecord", "activesupport"]
deps: ["port-activejob-enqueuing-and-configured-job"]
deps-rfc: []
est-loc: 350
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/enqueue_after_transaction_commit.rb` (44 lines) overrides the private
`raw_enqueue` (`:6-42`). It is included into `Base` by the railtie's
`on_load(:active_record)` (`railtie.rb:28-53`) and in tests by
`vendor/rails/v8.0.2/activejob/test/helper.rb:27`.

**`ActiveRecord` is read at call time, through `TopLevel`** (RFC "Package
shape"); activejob has no activerecord dependency, and the Rails test replaces
the constant with a fake (`stub_const(Object, :ActiveRecord, fake_active_record,
exists: false)`, `test/cases/enqueue_after_transaction_commit_test.rb:60,69,78,92`):

- activesupport: add `ActiveRecord?: { afterAllTransactionsCommit(block: () => unknown): unknown }`
  to `TopLevel`'s type (`packages/activesupport/src/namespaces.ts:30-58`).
- activerecord: seat `TopLevel.ActiveRecord` with the `ActiveRecord` module whose
  singleton methods live in `packages/activerecord/src/active-record.ts`
  (`afterAllTransactionsCommit` at `:455`), per CLAUDE.md § "Call-time constant
  resolution".
- activejob reads `TopLevel.ActiveRecord!.afterAllTransactionsCommit(…)`
  unguarded; Rails has no `defined?` here.

`vendor/rails/v8.0.2/activejob/test/cases/enqueue_after_transaction_commit_test.rb`: 4 cases, as `parity:test` names them:

- [ ] `:58` EnqueueAfterTransactionCommitTest — "#perform_later wait for transactions to complete before enqueuing the job"
- [ ] `:67` EnqueueAfterTransactionCommitTest — "#perform_later returns the Job instance even if it's delayed by `after_all_transactions_commit`"
- [ ] `:76` EnqueueAfterTransactionCommitTest — "#perform_later yields the enqueued Job instance even if it's delayed by `after_all_transactions_commit`"
- [ ] `:90` EnqueueAfterTransactionCommitTest — "#perform_later assumes successful enqueue, but update status later"

The test's `FakeActiveRecord` (`:7-29`) and its two inline job classes are
ported with it; `enqueue_error_job` comes from the enqueuing story.

## Fidelity traps (predicted at authoring)

- [ ] **Deprecated Symbol arms.** `:always` / `:never` / `:default` (`:10-27`) are `":always"` / `":never"` / `":default"`, each warning through `ActiveJob.deprecator` with Rails' `squish`ed message.
- [ ] **Deferred path** (`:32-38`): sets `successfully_enqueued = true`, registers `after_all_transactions_commit {{ self.successfully_enqueued = false; super }}`, and returns `self`. The deferred `super` is awaited inside the callback.
- [ ] **`stubConst` restore timing.** `stubConst(TopLevel, "ActiveRecord", fake, block, {{ exists: false }})` (`packages/activesupport/src/testing/constant-stubbing.ts:3`) must restore when an async block settles; converge it here if it restores on return.
- [ ] **`enqueue_after_transaction_commit` reader** is a `class_attribute` with `instance_predicate: false` (`enqueuing.rb:53`).

## Acceptance criteria

- [ ] `enqueue_after_transaction_commit.rb` reads complete in `parity:api`; `packages/activejob/package.json` still has no activerecord dependency.
- [ ] The 4 cases pass in all lanes.
- [ ] A `.trails.test.ts` in activerecord shows a job enqueued inside a real transaction on a canonical model enqueues only after commit.

## Definition of done

Importing `@blazetrails/activerecord` into activejob, or a `TopLevel.ActiveRecord?.` guard Rails does not have, does not close this story.
