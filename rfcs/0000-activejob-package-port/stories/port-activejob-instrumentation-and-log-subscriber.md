---
title: "Port ActiveJob::Instrumentation, Logging and LogSubscriber"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob", "activesupport"]
deps: ["port-activejob-callbacks-timezones-and-translation"]
deps-rfc: []
est-loc: 450
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails files, under `vendor/rails/v8.0.2/activejob/lib/active_job/`:

- `instrumentation.rb` (52 lines): the private singleton
  `ActiveJob.instrument_enqueue_all` (`:4-14`), which `perform_all_later`
  already calls; and `Instrumentation`, made of an `around_enqueue` that picks
  `:enqueue_at` or `:enqueue` (`:19-23`), `perform_now` wrapping
  `instrument(:perform) { super }` (`:25-27`), `_perform_job` emitting
  `:perform_start` (`:30-33`), the private `instrument` (`:35-45`), which
  stamps `job` / `adapter` / `aborted` onto the payload, and
  `halted_callback_hook` (`:47-50`), which calls `super` and sets
  `@_halted_callback_hook_called`. activesupport's callback runner already
  consults `haltedCallbackHook` (`packages/activesupport/src/callbacks.ts:405`).
- `logging.rb` (49 lines): `cattr_accessor :logger` defaulting to
  `TaggedLogging.new(Logger.new(STDOUT))` (`:15`), `class_attribute
:log_arguments` (`:26`), `around_enqueue(prepend: true)` → `tag_logger`
  (`:28`), `perform_now` → `tag_logger(self.class.name, job_id) { super }`
  (`:31-33`), and private `tag_logger` / `logger_tagged_by_active_job?`
  (`:36-47`). `logger.respond_to?(:tagged)` is `rbObjRespondTo`.
- `log_subscriber.rb` (216 lines): `LogSubscriber < ActiveSupport::LogSubscriber`,
  with `class_attribute :backtrace_cleaner` (`:7`), the eight event handlers
  `enqueue` / `enqueue_at` / `enqueue_all` / `perform_start` / `perform` /
  `enqueue_retry` / `retry_stopped` / `discard` (`:9-139`), the private
  formatters (`:141-205`) and `enqueued_jobs_message` (`:207-212`), and
  `attach_to :active_job` (`:216`). `ActiveJob.verbose_enqueue_logs`
  (`active_job.rb:57`) gates `log_enqueue_source` (`:191-197`).
  `enqueue_source_location`'s `Thread.each_caller_location` (`:199-205`) ports
  as `callerLocations()`, the way `packages/activerecord/src/log-subscriber.ts:131-132`
  already ports AR's `query_source_location`.

`Base` gains `include Instrumentation` and `include Logging`
(`base.rb:72-73`). `perform_now`'s `super` chain across `Execution`,
`Instrumentation` and `Logging` is Ruby's module linearization. Build it with
`include()` so each `super` reaches the next module, as in `relation.ts` with
`relation/query-methods.ts`. Do not flatten it into one body.

**Scoped state restores on settle.** `tag_logger`'s `logger.tagged(*tags,
&block)` and `Notifications.instrument("…", payload) { … }` both wrap an async
`perform_now`. Check that activesupport's `TaggedLogging#tagged` and
`Notifications.instrument` keep their tags and finish the event when the
promise settles, not when it is returned. `Notifications.subscribed` is already
async (`packages/activesupport/src/notifications.ts:104`). If either one is
sync-only, converge it here with the same pattern as
`port-activejob-callbacks-timezones-and-translation`'s `useZone`.

Tests:

- `test/cases/instrumentation_test.rb`: `"perform_now emits perform events"`
  and `"perform_later emits an enqueue event"` (`:14-26`). The retry and
  discard cases (`:27-53`) need `retry_on` and land with
  `port-activejob-exceptions-retry-and-discard`;
- `test/cases/queuing_test.rb` `"perform_all_later instrumentation"` (`:88-104`).

`logging_test.rb` is its own story (`port-activejob-logging-test`). The
`ActiveSupport::LogSubscriber::TestHelper` it needs is
`port-activesupport-log-subscriber-test-helper`.

## Acceptance criteria

- [ ] `instrumentation.rb`, `logging.rb` and `log_subscriber.rb` read complete
      in `parity:api`.
- [ ] `perform_now` reaches `Logging` → `Instrumentation` → `Execution` through
      real `super` calls. `pnpm parity:api:calls` shows no new rows.
- [ ] A `perform.active_job` event's duration covers an awaited `perform`
      body.
- [ ] The three cases above pass.

## Definition of done

Collapsing `Logging#perform_now`, `Instrumentation#perform_now` and `Execution#perform_now` into one body does not close this story, and neither does an event that finishes before the awaited `perform`.
