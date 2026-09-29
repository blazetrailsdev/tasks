---
title: "Port ActiveJob::Logging (logger, log_arguments, tag_logger)"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob", "activesupport"]
deps: ["port-activejob-instrumentation"]
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job/logging.rb` (49 lines): `cattr_accessor :logger, default:
TaggedLogging.new(Logger.new(STDOUT))` (`:15`); `class_attribute
:log_arguments, instance_accessor: false, default: true` (`:26`);
`around_enqueue(prepend: true) { |_, block| tag_logger(&block) }` (`:28`);
`perform_now` → `tag_logger(self.class.name, self.job_id) { super }`
(`:31-33`); private `tag_logger` (`:36-43`) and
`logger_tagged_by_active_job?` (`:45-47`).

`Base` gains `include Logging` (`base.rb:73`).

## Fidelity traps (predicted at authoring)

- [ ] **`TaggedLogging#tagged` with an async block** must keep the tags until the promise settles; check activesupport's and converge it here if needed.
- [ ] **`cattr_accessor :logger`** generates an instance reader that fixtures override (`OverriddenLoggingJob#logger`); it must be a prototype accessor, not a field.
- [ ] **`logger.respond_to?(:tagged)`** (`:37`) is `rbObjRespondTo`.
- [ ] **`tags.unshift "ActiveJob" unless logger_tagged_by_active_job?`** reads `logger.formatter.current_tags` (`:46`) at call time.
- [ ] **`around_enqueue(prepend: true)`** puts the tagging outermost in the enqueue chain.
- [ ] **`log_arguments?`** is the class predicate `class_attribute` generates (read by `log_subscriber.rb:146`): `isLogArguments`, returning the stored value.

## Acceptance criteria

- [ ] `logging.rb` reads complete in `parity:api`.
- [ ] Nested jobs (`NestedJob` enqueuing `LoggingJob`) produce `[ActiveJob] [NestedJob] [id]` then `[ActiveJob] [LoggingJob] [id]` tags, with `ActiveJob` added once.

## Definition of done

Tagging outside the `perform_now` `super` chain does not close this story.
