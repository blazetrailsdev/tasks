---
title: "Port ActiveJob::Enqueuing (perform_later / enqueue / perform_all_later) and ConfiguredJob, async"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-queue-adapter-and-inline-adapter", "port-activejob-queue-name-and-priority"]
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

`vendor/rails/v8.0.2/activejob/lib/active_job/enqueuing.rb` (140 lines): `EnqueueError` (`:8`); `ActiveJob.perform_all_later(*jobs)`
(`:14-37`); `included { class_attribute :enqueue_after_transaction_commit … }`
(`:43-54`); `ClassMethods#perform_later(...)` (`:81-88`) and private
`job_or_instantiate` with `ruby2_keywords` (`:91-94`); `enqueue(options = {})`
(`:112-125`); private `raw_enqueue` (`:128-138`).

`vendor/rails/v8.0.2/activejob/lib/active_job/configured_job.rb` (22 lines): `ConfiguredJob#initialize(job_class, options = {})`,
`perform_now(...)` → `new(...).set(@options).perform_now`, `perform_later(...)` →
`new(...).enqueue @options`, `perform_all_later(multi_args)` →
`@job_class.perform_all_later(multi_args, options: @options)`.

RFC 0116's `port-after-commit-jobs-callback` depends on this story for
`perform_later`. The `enqueue_error_job` fixture (`test/jobs/enqueue_error_job.rb`,
with its raising adapter) lands here.

`Base` gains `include Enqueuing` (`base.rb:68`). The `perform_all_later`
instrumentation (`instrument_enqueue_all`) is called through its seat and filled
by `port-activejob-instrumentation`.

## Fidelity traps (predicted at authoring)

- [ ] **The block is captured and awaited.** `yield job if block_given?` (`:85`) comes after `enqueue`; CLAUDE.md § "A create path awaits its block before saving" is the shape.
- [ ] **`perform_later` returns `enqueue_result`** (`:87`): the job, or `false` when a `before_enqueue` aborts (`enqueue` returns `false`, `:120-124`).
- [ ] **`jobs.flatten!` mutates the caller's array** (`:15`); `group_by(&:queue_adapter)` groups by adapter identity.
- [ ] **`rescue EnqueueError => e` inside a block** (`:29`) is a per-job rescue in `perform_all_later`'s fallback loop; `raw_enqueue`'s rescue (`:136`) is method-level. Both must catch an awaited rejection and only `EnqueueError`.
- [ ] **`queue_adapter.respond_to?(:enqueue_all)`** (`:18`) is `rbObjRespondTo`.
- [ ] **`if job.scheduled_at` / `if scheduled_at`** (`:23`, `:129`) is truthiness on a Time; `scheduled_at.to_f` is Ruby float seconds with sub-second precision.
- [ ] **`adapter_jobs.count(&:successfully_enqueued?)`** (`:32`) counts truthy predicate values.
- [ ] **`perform_all_later` returns `nil`** (`:36`), not the count.
- [ ] **`job_or_instantiate`**: `args.first.is_a?(self)` (`:92`) returns the passed instance, else `new(*args)` with the kwargs flag preserved.
- [ ] **`ConfiguredJob#perform_all_later` calls a method Rails 8.0.2 does not define.** It sends `@job_class.perform_all_later(multi_args, options: @options)` (`configured_job.rb:19`), but the only `perform_all_later` in `lib/` is the module method `ActiveJob.perform_all_later(*jobs)` (`enqueuing.rb:14`); `Base` has no class-level one, so the Ruby call raises `NoMethodError`. Port the call as written, do not invent a class-level `perform_all_later` to make it work, and add a `.trails.test.ts` pinning the `NoMethodError`.

## Acceptance criteria

- [ ] `enqueuing.rb` and `configured_job.rb` read complete in `parity:api`.
- [ ] `enqueue`, `raw_enqueue`, `perform_later` and `perform_all_later` are async, each citing the CLAUDE.md section from `port-activejob-execution`.
- [ ] `await HelloJob.performLater("x", async (job) => { … })` awaits the block before it resolves.

## Definition of done

A `perform_later` that fires its block without awaiting it, or a sync `enqueue`, does not close this story.
