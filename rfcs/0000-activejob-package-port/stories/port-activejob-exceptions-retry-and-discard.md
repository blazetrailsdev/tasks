---
title: "Port ActiveJob::Exceptions (retry_on / discard_on / after_discard, backoff and jitter) and exceptions_test.rb"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-instrumentation-and-log-subscriber"]
deps-rfc: []
est-loc: 600
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/exceptions.rb` (206 lines):

- `class_attribute :retry_jitter` (default `0.0`) and `:after_discard_procs`
  (`:10-13`);
- `retry_on(*exceptions, wait: 3.seconds, attempts: 5, queue: nil, priority:
nil, jitter: JITTER_DEFAULT)` (`:62-81`), a `rescue_from` whose handler
  retries through `retry_job`, or at the limit yields, instruments
  `:retry_stopped`, runs the after-discard procs, and re-raises when no block
  is given;
- `discard_on` (`:103-110`), `after_discard` (`:124-126`), and `retry_job`
  (`:151-155`), which does `instrument :enqueue_retry` around `enqueue options`;
- private `JITTER_DEFAULT` (`:158-159`), `determine_delay` (`:161-180`),
  `determine_jitter_for_delay` (`:182-185`), `executions_for` (`:187-194`)
  and `run_after_discard_procs` (`:196-204`).

It depends on `Instrumentation#instrument` (the `:retry_stopped`,
`:enqueue_retry` and `:discard` events), hence the dep. `Base` gains
`include Exceptions` at `base.rb:71`.

Port details that are easy to get wrong:

- **`attempts == :unlimited`** (`:65`) and **`when :polynomially_longer`**
  (`:165`) compare against Symbols. Under CLAUDE.md's rule these are the
  strings `":unlimited"` and `":polynomially_longer"`.
- **`exception_executions[exceptions.to_s]`** (`:189`) keys a counter by Ruby
  `Array#to_s` of the exception classes, for example
  `"[ActiveJob::DeserializationError]"`. The key is serialized into job data
  (`core.rb` `serialize`), so it must be the Ruby inspect string
  (`rbInspect`), not a JS `join`.
- **`when ActiveSupport::Duration, Integer`** (`:169`) and `when Proc`
  (`:173`) are the three algorithm arms. The `else` raises a bare
  `RuntimeError` with Rails' message (`:177`).
- **`Kernel.rand`** (`:184`) is what the tests stub. Port it through
  ruby-compat's `kernelRand` (`packages/ruby-compat/src/kernel-rand.ts`) so
  the stub has a seam.
- The `rescue_from` handler body awaits `retry_job` / `enqueue`. This is the
  RFC's async shape, and `rescue_with_handler` in `perform_now` awaits the
  handler.

Fixtures: `jobs/retry-job.ts` (`test/jobs/retry_job.rb`, 54 lines, with its
error classes), `after-discard-retry-job.ts` (33).

Tests: `test/cases/exceptions_test.rb`, 29 of its 30 cases (383 lines), in the
`inline` lane, plus `test/cases/instrumentation_test.rb`'s three retry and
discard event cases (`:27-53`). `"successfully retry job throwing
DeserializationError"` (`:308-311`) is not in this story. It enqueues
`Person.new(404)`, which only raises `DeserializationError` once the GlobalID
arm exists, so it lands with
`port-activejob-globalid-arguments-and-rescue-tests`, which depends on this
story.

If the port runs past 600 LOC, the agreed split point is
`exceptions_test.rb:204`: the 15 cases before it (`:25-203`) and the 14 after
it (`:205-383`, minus `:308`). File the tail as a sibling story.

## Acceptance criteria

- [ ] `exceptions.rb` reads complete in `parity:api`.
- [ ] `exception_executions` keys match Rails' `Array#to_s` spelling. A test
      asserts the serialized job data.
- [ ] `exceptions_test.rb`'s 29 cases and the three `instrumentation_test.rb`
      cases pass under their Rails names.
