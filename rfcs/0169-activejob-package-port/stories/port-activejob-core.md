---
title: "Port ActiveJob::Core: job attributes, initialize, serialize / deserialize, set"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["register-activejob-constants-for-class-name-round-trip", "port-activejob-arguments"]
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

`vendor/rails/v8.0.2/activejob/lib/active_job/core.rb` (202 lines), included into `Base` at `base.rb:64`:

- thirteen `attr_*` (`:12-49`): `arguments`, `serialized_arguments=`,
  `scheduled_at`, `job_id`, `queue_name=`, `priority=`, `provider_job_id`,
  `executions`, `exception_executions`, `locale`, `timezone`, `enqueued_at`,
  `successfully_enqueued=`; `successfully_enqueued?` (`:51-53`) and
  `enqueue_error` (`:56`);
- `ClassMethods#deserialize` (`:62-66`) and `ClassMethods#set` (`:86-88`, which
  returns `ConfiguredJob.new(self, options)`);
- `initialize(*arguments)` (`:93-102`) with `ruby2_keywords(:initialize)`
  (`:103`);
- `serialize` (`:107-122`), `deserialize(job_data)` (`:150-162`), `set(options)`
  (`:165-172`);
- private `serialize_arguments_if_needed`, `deserialize_arguments_if_needed`,
  `serialize_arguments`, `deserialize_arguments`, `arguments_serialized?`
  (`:175-200`).

## Fidelity traps (predicted at authoring)

- [ ] **Accessors, not class fields.** `attr_accessor` generates methods that subclasses override: the fixtures `LoggingJob` / `NestedJob` / `DisableLogJob` redefine `job_id` (`test/jobs/logging_job.rb`). A TS class field on `Core` is an own property that shadows a subclass getter; declare the attributes as prototype accessors over private storage.
- [ ] **Value-returning predicates.** `successfully_enqueued?` returns `@successfully_enqueued` (possibly `nil`) and `arguments_serialized?` returns `@serialized_arguments` (an Array). Port as `isSuccessfullyEnqueued` / `isArgumentsSerialized` returning the stored value; callers test `!= null && !== false`, so an empty serialized array still counts as serialized.
- [ ] **`set` truthiness.** `if options[:wait]` (`:166`) is true for `0` in Ruby, so `wait: 0` schedules at now; likewise `:wait_until`, `:queue`, `:priority` (`:167-169`). Port as `!= null && !== false`.
- [ ] **`options[:wait].seconds.from_now`** accepts an Integer or a `Duration`; both arms are exercised by the fixtures (`set(wait: 1.day)` style). `options[:priority].to_i` is Ruby `to_i`.
- [ ] **`||` keeps `""`.** `job_data["locale"] || I18n.locale.to_s` and `job_data["timezone"] || Time.zone&.name` (`:158-159`) fall through only for `nil`/`false`; use `??`, not JS `||`.
- [ ] **`if job_data["enqueued_at"]` / `["scheduled_at"]`** (`:160-161`) are Ruby truthiness; `Time.iso8601` parses nine fractional digits.
- [ ] **`Time.now.utc.iso8601(9)`** (`:119`) needs nanosecond precision (`job_serialization_test.rb` "serializes and deserializes enqueued_at with full precision").
- [ ] **`"job_class" => self.class.name`** uses the Ruby-name reader from `register-activejob-constants-for-class-name-round-trip`; `ClassMethods#deserialize` `constantize`s it.
- [ ] **`ruby2_keywords(:initialize)`** flags a trailing kwargs object through `port-ruby-compat-ruby2-keywords-hash-flag`.
- [ ] **`Time.zone&.name`** (`:101`) is a safe-navigation read: `null` when no zone is set.
- [ ] **Serialized key order** is Rails' (`:108-121`); tests compare the hash.

## Acceptance criteria

- [ ] `core.rb` reads complete in `parity:api` (the `queue_name` / `priority` readers are `port-activejob-queue-name-and-priority`'s).
- [ ] `deserialize_arguments_if_needed` is async and is the only async member here.
- [ ] The traps below each have a `.trails.test.ts` case that fails on the naive port.

## Definition of done

Declaring job attributes as TS class fields (which shadow subclass accessors), or `if (options.wait)`, does not close this story.
