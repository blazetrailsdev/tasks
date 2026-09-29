---
title: "Port ActiveJob::Exceptions (retry_on / discard_on / after_discard / retry_job, backoff and jitter)"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-instrumentation", "port-activejob-test-fixture-jobs"]
deps-rfc: []
est-loc: 400
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/exceptions.rb` (206 lines): `class_attribute :retry_jitter` (default
`0.0`) and `:after_discard_procs` (default `[]`) (`:10-13`); `retry_on`
(`:62-81`); `discard_on` (`:103-110`); `after_discard` (`:124-126`);
`retry_job` (`:151-155`); private `JITTER_DEFAULT` (`:158-159`),
`determine_delay` (`:161-180`), `determine_jitter_for_delay` (`:182-185`),
`executions_for` (`:187-194`), `run_after_discard_procs` (`:196-204`).

`Base` gains `include Exceptions` (`base.rb:71`). Fixtures that need it land
here: `test/jobs/retry_job.rb` (54 lines, with its error classes),
`after_discard_retry_job.rb` (33), `rescue_job.rb` (37; `rescue_from` +
`retry_job`) and `raising_job.rb` (11; `retry_on(MyError, attempts: 2)`,
`error.constantize`). Each is registered under its Ruby name.

The Rails coverage is `port-activejob-exceptions-test-part-1` / `-part-2` and
`port-activejob-rescue-and-instrumentation-tests`.

## Fidelity traps (predicted at authoring)

- [ ] **`exception_executions[exceptions.to_s]`** (`:189`) keys a counter by Ruby `Array#to_s` of the exception classes (`"[RetryJob::ExponentialWaitTenAttemptsError]"`). It is persisted, so build it with `rbInspect` over Ruby names.
- [ ] **Symbols.** `attempts == :unlimited` (`:65`) and `when :polynomially_longer` (`:165`) are `":unlimited"` / `":polynomially_longer"`.
- [ ] **`wait:` arms.** `when ActiveSupport::Duration, Integer` (`:169`), `when Proc` (`:173`, called with `executions`), else `raise "Couldn't determine a delay based on …"` — a bare `RuntimeError` with `inspect` of the value (`:177`).
- [ ] **`jitter == JITTER_DEFAULT ? retry_jitter : (jitter || 0.0)`** (`:162`): a sentinel object distinguishes "not passed" from `nil`; a TS default parameter would swallow an explicit `nil`. Keep the sentinel.
- [ ] **`return 0.0 if jitter.zero?`** then `Kernel.rand * delay * jitter` (`:183-184`) — tests stub `Kernel.rand`; use ruby-compat's `kernelRand` (`packages/ruby-compat/src/kernel-rand.ts`) so the stub has a seam.
- [ ] **`if block_given?` in `retry_on`** (`:69-78`): the given block is yielded `(self, error)` inside `instrument :retry_stopped`; without a block the error re-raises after `run_after_discard_procs`.
- [ ] **`run_after_discard_procs`** (`:196-204`) runs every proc, collects `StandardError`s, and raises the **last** one.
- [ ] **`if exception_executions`** (`:188`) is Ruby truthiness on a Hash that `deserialize` may have set to `nil` (`core.rb:157` reads it straight from job data); keep the `else executions` arm.
- [ ] **Handlers are async.** `retry_job` awaits `enqueue`; `rescue_from` handlers are awaited by `rescue_with_handler`.

## Acceptance criteria

- [ ] `exceptions.rb` reads complete in `parity:api`.
- [ ] `exception_executions` keys match Rails' `Array#to_s` spelling, asserted against serialized job data.

## Definition of done

An `exception_executions` key built with JS `join` / `String(array)` does not close this story.
