---
title: "Port ActiveJob::Callbacks (perform / enqueue chains and the six macros) with callbacks_test.rb"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-enqueuing-and-configured-job", "port-activejob-test-fixture-jobs"]
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

`vendor/rails/v8.0.2/activejob/lib/active_job/callbacks.rb:18-166`, less the singleton `:execute` chain (`:22-25`) that
`port-activejob-execution` landed: `included` defines `:perform` and `:enqueue`
with `skip_after_callbacks_if_terminated: true` (`:27-30`); `ClassMethods` has
`before_perform` / `after_perform` / `around_perform` / `before_enqueue` /
`after_enqueue` / `around_enqueue`, each a `set_callback` (`:50-164`).

`Base` gains `include Callbacks` (`base.rb:70`). activesupport's chain already
awaits promise-returning callbacks and `around` blocks
(`packages/activesupport/src/callbacks.ts:47-56`).

Fixtures: `test/jobs/callback_job.rb` (29 lines) and
`abort_before_enqueue_job.rb` (24).

`vendor/rails/v8.0.2/activejob/test/cases/callbacks_test.rb`: 8 cases, as `parity:test` names them:

- [ ] `:10` CallbacksTest — "perform callbacks"
- [ ] `:19` CallbacksTest — "perform return value"
- [ ] `:29` CallbacksTest — "perform around_callbacks return value"
- [ ] `:45` CallbacksTest — "enqueue callbacks"
- [ ] `:53` CallbacksTest — "#enqueue returns false when before_enqueue aborts callback chain"
- [ ] `:57` CallbacksTest — "#enqueue does not run after_enqueue callbacks when previous callbacks aborted"
- [ ] `:64` CallbacksTest — "#perform does not run after_perform callbacks when swhen previous callbacks aborted"
- [ ] `:71` CallbacksTest — "#enqueue returns self when the job was enqueued"

## Fidelity traps (predicted at authoring)

- [ ] **`throw :abort`** halts the chain; `enqueue` then returns `false` and `after_enqueue` does not run (`skip_after_callbacks_if_terminated`). `#perform does not run after_perform callbacks when swhen previous callbacks aborted` keeps Rails' typo.
- [ ] **`around_perform` return value.** `"perform around_callbacks return value"` asserts `perform_now` returns the block's value through an `around`; an awaited `around` must pass the inner value through.
- [ ] **Callback blocks receive the job** (`|job|`) and are `instance_exec`'d; port with the job bound as `this` and passed.

## Acceptance criteria

- [ ] `callbacks.rb` reads complete in `parity:api`.
- [ ] The 8 cases above pass in all lanes under their Rails names.

## Definition of done

Re-implementing halting in activejob rather than through the `:abort` terminator does not close this story.
