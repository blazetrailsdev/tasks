---
title: "Port ActiveJob::Execution (perform_now / execute / perform) async, and ratify the async shape in CLAUDE.md"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-core"]
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

`vendor/rails/v8.0.2/activejob/lib/active_job/execution.rb` (72 lines): `include ActiveSupport::Rescuable` (`:14`);
`ClassMethods#perform_now(...)` (`:22-24`) and `execute(job_data)` (`:26-31`),
which runs `ActiveJob::Callbacks.run_callbacks(:execute) { deserialize(job_data).perform_now }`;
`perform_now` (`:45-58`); `perform(*)` (`:60-62`); private `_perform_job`
(`:65-70`).

`execute` needs the `:execute` chain, so this story also lands
`vendor/rails/v8.0.2/activejob/lib/active_job/callbacks.rb:22-25`: `ActiveJob::Callbacks`' singleton
`include ActiveSupport::Callbacks; define_callbacks :execute`. The rest of
`callbacks.rb` is `port-activejob-callbacks`'.

**Ratify the async shape.** Add a CLAUDE.md section to trails, "A job's
`perform` and `enqueue` are async (`perform_now` / `perform_later`)", in the
shape of § "A create path awaits its block before saving". It records the Rails
bodies, the language shortcoming (JS has no synchronous await; every AR read and
every `GlobalID::Locator.locate` is awaited), why a sync `perform_now` plus an
async twin was rejected (RFC "Alternatives considered"), and the members that
stay sync (RFC "Async shape"). Every async member in the later stories cites it.

## Fidelity traps (predicted at authoring)

- [ ] **`rescue Exception => exception`** (`:52`) catches everything, including non-`StandardError`s, and must catch an awaited rejection. `return handled if handled` (`:54`) is Ruby truthiness on the handler's return value: a handler returning `false` or `nil` falls through to `run_after_discard_procs` and re-raise.
- [ ] **`run_after_discard_procs`** (`:56`) is `Exceptions`' (`port-activejob-exceptions`); until that lands, call it through the module seat so the call-parity gate sees the call.
- [ ] **`(executions || 0) + 1`** (`:47`) is Ruby `||`: use `?? 0`.
- [ ] **`ActiveSupport::ExecutionContext[:job] = self`** (`:66`) goes through `packages/activesupport/src/execution-context.ts`, per async execution context.
- [ ] **`perform(*arguments)`** spreads the stored arguments; a trailing ruby2_keywords-flagged hash is the kwargs object the fixture's `perform({ argument })` receives.
- [ ] **`fail NotImplementedError`** (`:61`): ruby-compat's `NotImplementedError`, not a JS `Error`.
- [ ] **`Rescuable`** is activesupport's; `rescue_from` handlers may be async and are awaited.

## Acceptance criteria

- [ ] `execution.rb` and `callbacks.rb:22-25` read complete in `parity:api`.
- [ ] The CLAUDE.md section exists, and `perform_now` / `execute`'s JSDoc cite it.
- [ ] A `.trails.test.ts` shows an `async perform` finishing before `perform_now` resolves, and an error in it reaching `rescue_with_handler`.

## Definition of done

A sync `perform_now`, or one that returns before an async `perform` settles, does not close this story.
