---
title: "Port ActiveJob::Base, Core, QueueName, QueuePriority and ConfiguredJob"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-arguments"]
deps-rfc: []
est-loc: 500
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails files, all under `vendor/rails/v8.0.2/activejob/lib/`:

- `active_job.rb:34-59`: the `ActiveJob` namespace. It does `extend
ActiveSupport::Autoload` (`:35`), autoloads `Base`, `QueueAdapters`,
  `Arguments`, `EnqueueAfterTransactionCommit`, `Serializers`, `ConfiguredJob`,
  `TestCase` and `TestHelper` (`:37-50`), and defines
  `singleton_class.attr_accessor :verbose_enqueue_logs` (`:57-58`). Build it
  as `src/namespaces.ts` the way `arel/src/namespaces.ts` and
  `activerecord/src/namespaces.ts` are built (CLAUDE.md § "Call-time constant
  resolution"). Each constant is seated by its defining module.
- `active_job/base.rb:63-78`: `class Base` includes 12 modules, then
  `ActiveSupport.run_load_hooks(:active_job, self)` (`:77`). In this story
  `Base` includes only the four modules below. Each later story adds its own
  `include` line, in Rails' order. Fire the load hook here, because
  trailties' `onLoad("activeJob", …)` consumers depend on it.
- `active_job/core.rb:8-201`: 13 `attr_*` (`:12-49`), `successfully_enqueued?`
  (`:51-53`), `enqueue_error` (`:56`), `ClassMethods#deserialize` / `set`
  (`:62-88`), `initialize(*arguments)` (`:93-102`, which captures
  `I18n.locale` and `Time.zone&.name`), `serialize` (`:107-122`), `deserialize`
  (`:150-163`), `set` (`:165-172`), and the private
  `serialize_arguments_if_needed` / `deserialize_arguments_if_needed` /
  `serialize_arguments` / `deserialize_arguments` / `arguments_serialized?`
  (`:175-200`). `deserialize_arguments_if_needed` is async (RFC "Async
  shape").
- `active_job/queue_name.rb:4-67`: `queue_as`, `queue_name_from_part`,
  `default_queue_name` (`mattr_accessor`, `:9`), the three `class_attribute`s
  (`:55-57`), and `queue_name` (`:61-66`).
- `active_job/queue_priority.rb:4-59`: `queue_with_priority`,
  `default_priority`, and `priority`.
- `active_job/configured_job.rb:4-21`: `ConfiguredJob`, which `set` returns.
  Its `perform_now` / `perform_later` / `perform_all_later` forward to methods
  that `port-activejob-enqueuing-execution-and-inline-adapter` defines, so it
  is ported here and exercised there.

Each `class_attribute` is activesupport's `classAttribute()`. That settles RFC
Open question 3: reads walk the chain, writes are local, and there is no
`inherited` hook. `default: -> { self.class.default_queue_name }`
(`queue_name.rb:55`) keeps the lambda default.

Job fixtures land here, under `packages/activejob/src/test-helpers/`
(RFC "Canonical job fixtures"): `jobs/application-job.ts`, `hello-job.ts`,
`configuration-job.ts`, `prefixed-job.ts`, `logging-job.ts`, `nested-job.ts`,
`provider-jid-job.ts`, and `support/job-buffer.ts` (`test/support/job_buffer.rb`).

Tests:

- `test/cases/queue_naming_test.rb`: 12 of 14. The two `"is assigned when
perform_now"` / `"… perform_later"` cases (`:151-161`) go to the enqueuing
  story.
- `test/cases/queue_priority_test.rb`: 4 of 6, with the same two split out
  (`:50-60`).
- `test/cases/job_serialization_test.rb`: 8 of 9. `"serialize job with gid"`
  (`:15-18`) goes to `port-activejob-globalid-arguments-and-rescue-tests`.

## Acceptance criteria

- [ ] `core.rb`, `queue_name.rb`, `queue_priority.rb`, `configured_job.rb`
      and `base.rb` read complete in `parity:api`. `base.rb`'s remaining
      `include`s are the later stories'.
- [ ] `ActiveJob.Base` is seated on the namespace, and
      `onLoad("activeJob", …)` fires with `Base` as its argument.
- [ ] The 24 cases above pass under their Rails names.
- [ ] A plain-node import of the built `dist/base.js` as the entry module
      succeeds, so there is no TDZ cycle through `namespaces.ts`.

## Definition of done

A hand-rolled `inherited` hook or copy-on-first-write `class_attribute` does not close this story. Use `classAttribute()`.
