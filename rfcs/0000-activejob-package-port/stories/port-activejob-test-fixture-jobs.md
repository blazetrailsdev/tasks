---
title: "Mirror activejob/test/jobs, models/person and support/stubs as canonical fixtures, registered under their Ruby names"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-enqueuing-and-configured-job",
    "register-activejob-constants-for-class-name-round-trip",
  ]
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

`vendor/rails/v8.0.2/activejob/test/jobs/` (24 files) are ActiveJob's canonical job classes, as
`activerecord/test/models/` are for AR (RFC "Canonical job fixtures"). This
story mirrors the ones that need only `Base`, `queue_as`, `set` and
`perform_later` into `packages/activejob/src/test-helpers/`:

- `jobs/`: `application_job`, `hello_job`, `configuration_job`, `prefixed_job`,
  `logging_job`, `nested_job`, `overridden_logging_job`, `disable_log_job`,
  `provider_jid_job`, `inherited_job`, `queue_adapter_job`, `kwargs_job`,
  `multiple_kwargs_job`, `arguments_round_trip_job`, `gid_job`;
- `models/person.rb` (22 lines; `include GlobalID::Identification`,
  `Person::RecordNotFound` on id 404, `==` by id);
- `support/stubs/strong_parameters.rb` (15 lines).

`support/job_buffer.rb` landed with the inline lane. Fixtures that need later
modules land with those stories: `callback_job` / `abort_before_enqueue_job`
(callbacks), `retry_job` / `after_discard_retry_job` / `rescue_job` /
`raising_job` (exceptions), `timezone_dependent_job` / `translated_hello_job`
(timezones), `enqueue_error_job` (enqueuing).

Each fixture class, and each error class nested in one, is registered under its
Ruby name (`register-activejob-constants-for-class-name-round-trip`), so
`job_class` round-trips.

## Fidelity traps (predicted at authoring)

- [ ] **Overridden readers.** `LoggingJob` / `NestedJob` / `DisableLogJob` define `job_id`, and `OverriddenLoggingJob` defines `logger`; these must override `Core`'s / `Logging`'s accessors (which is why those must not be class fields).
- [ ] **Kwargs fixtures.** `KwargsJob#perform(argument: 1)` and `MultipleKwargsJob#perform(argument1:, argument2:)` take the ruby2_keywords-flagged options object; `argument: 1` is a default for an absent key only, not for an explicit `nil`.
- [ ] **`Person#==`** compares `id.to_s` (`person.rb`), so `Person.new(9) == Person.new("9")`; equality in `assert_enqueued_with` goes through it.
- [ ] **`self.queue_adapter = :inline`** on `InheritedJob` / `QueueAdapterJob` passes a Symbol.
- [ ] **`LoggingJob#perform(*dummy)`** logs `dummy.join(" ")` — Ruby `Array#join` recurses into nested arrays, JS `join` does not.

## Acceptance criteria

- [ ] Each listed Ruby file has a same-named TS file with the same class name, registered for `constantize`.
- [ ] No fixture invents behaviour its Ruby file does not have.

## Definition of done

Tests defining their own ad-hoc job classes where a Rails fixture exists do not close this story.
