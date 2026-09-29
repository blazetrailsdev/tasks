---
title: "Port ActiveJob::LogSubscriber"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-logging"]
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

`vendor/rails/v8.0.2/activejob/lib/active_job/log_subscriber.rb` (216 lines): `LogSubscriber < ActiveSupport::LogSubscriber`,
`class_attribute :backtrace_cleaner` (`:7`); eight handlers, each followed by
`subscribe_log_level` — `enqueue` (`:9-27`), `enqueue_at` (`:29-47`),
`enqueue_all` (`:49-74`), `perform_start` (`:76-84`), `perform` (`:86-103`),
`enqueue_retry` (`:105-118`), `retry_stopped` (`:120-128`), `discard`
(`:130-138`); private `queue_name`, `args_info`, `format`, `scheduled_at`,
`logger`, `info`, `error`, `log_enqueue_source`, `enqueue_source_location`,
`enqueued_jobs_message` (`:141-212`); `attach_to :active_job` (`:216`).
`subscribe_log_level` exists (`packages/activesupport/src/log-subscriber.ts:89`).

The messages are specified by `logging_test.rb` (45 cases), ported by
`port-activejob-logging-test-part-1` / `-part-2`.

## Fidelity traps (predicted at authoring)

- [ ] **`format(arg).inspect`** (`:148`) is `rbInspect`; `format` maps Hash/Array recursively and turns a `GlobalID::Identification` into `to_global_id` with an inline `rescue arg` (`:154-165`).
- [ ] **`#{job.class}` / `#{ex.class}`** use the Ruby-name reader (namespaced error names like `ActiveJob::DeserializationError`).
- [ ] **`event.duration.round(2)`** prints Ruby's `Float#round(2)#to_s` (`1.0`, not `1`).
- [ ] **`Array(ex.backtrace).join("\n")`** (`:91`): the backtrace lines are the error's frames, one per line, through the `backtrace_cleaner`.
- [ ] **`job.enqueued_at.present?`** (`:79`) is activesupport `isPresent`; `event.payload[:enqueued_count].to_i` is Ruby `to_i` of `nil` → `0`.
- [ ] **`'job'.pluralize(n)`**, **`job.arguments.any?`**, **`log_arguments?`** are activesupport/Ruby semantics.
- [ ] **`Thread.each_caller_location`** (`:199-205`) ports as `callerLocations()`, as `packages/activerecord/src/log-subscriber.ts:131-132` ports AR's `query_source_location`; gated by `ActiveJob.verbose_enqueue_logs` (`:191`).
- [ ] **`ex = event.payload[:exception_object] || job.enqueue_error`** (`:11`) is Ruby `||` over objects.
- [ ] **`attach_to :active_job`** runs at module load, so importing the subscriber subscribes it; a test that needs a clean subscriber list must detach.

## Acceptance criteria

- [ ] `log_subscriber.rb` reads complete in `parity:api`.
- [ ] Each handler's message strings are Rails' byte for byte.

## Definition of done

Formatting arguments with `JSON.stringify` or JS `String()` does not close this story.
