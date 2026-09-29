---
title: "Port QueueAdapter, QueueAdapters.lookup, AbstractAdapter and InlineAdapter, and the inline lane's test setup"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["port-activejob-execution"]
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

- `vendor/rails/v8.0.2/activejob/lib/active_job/queue_adapter.rb` (78 lines): `ActiveJob.adapter_name` (`:7-12`); the
  `_queue_adapter_name` / `_queue_adapter` `class_attribute`s and
  `delegate :queue_adapter, to: :class` (`:23-28`); `queue_adapter`,
  `queue_adapter_name`, `queue_adapter=` (`:34-63`); private `assign_adapter`,
  `QUEUE_ADAPTER_METHODS`, `queue_adapter?` (`:66-75`).
- `vendor/rails/v8.0.2/activejob/lib/active_job/queue_adapters.rb:112-139`: the `QueueAdapters` namespace with
  `Autoload`, `ADAPTER = "Adapter"` (private), and `lookup(name)`
  (`const_get(name.to_s.camelize << ADAPTER)`). Only the in-process adapters
  get `autoload` lines.
- `queue_adapters/abstract_adapter.rb` (19 lines) and `inline_adapter.rb`
  (23 lines): `InlineAdapter#enqueue` is `Base.execute(job.serialize)`, awaited;
  `enqueue_at` raises `NotImplementedError` with Rails' message.

**Test setup for the `inline` lane.** Port `vendor/rails/v8.0.2/activejob/test/helper.rb` (27 lines) and
`test/adapters/inline.rb` as the lane's vitest setup file: `GlobalID.app = "aj"`,
`ActiveJob::Base.logger = Logger.new(nil)`, `adapter_is?` (`helper.rb:21-23`),
and `test/support/job_buffer.rb` (27 lines) as
`src/test-helpers/support/job-buffer.ts`. The
`ActiveJob::Base.include(EnqueueAfterTransactionCommit)` line (`:27`) is added
by `port-activejob-enqueue-after-transaction-commit`.

`Base` gains `include QueueAdapter` (`base.rb:65`).

## Fidelity traps (predicted at authoring)

- [ ] **The getter has a side effect.** `queue_adapter` and `queue_adapter_name` assign `:async` when unset (`:35`, `:42`), instantiating an `AsyncAdapter` (a thread pool) on first read. Until `port-activejob-async-adapter` lands, `lookup("async")` raises; keep the call rather than special-casing it.
- [ ] **Symbol and String adapter names.** `when Symbol, String` (`:51`); `name_or_adapter.to_s` (`:54`) must strip a Symbol's colon, so `queue_adapter = ":test"` and `"test"` both store `"test"`.
- [ ] **`queue_adapter.try(:check_adapter)`** (`:53`) is activesupport `try`: absent method → `nil`, no raise.
- [ ] **`adapter.is_a?(Module)`** (`:10`) — a class passed as an adapter vs an instance; `respond_to?(:queue_adapter_name)` (`:8`) and `QUEUE_ADAPTER_METHODS.all? {{ respond_to? }}` (`:74`) are `rbObjRespondTo`.
- [ ] **`raise ArgumentError`** (`:60`) with no message: ruby-compat `ArgumentError` whose message is its class name, as Ruby's.
- [ ] **`name.demodulize.delete_suffix('Adapter').underscore`** for an instance adapter's name (`:11`, `:57`) uses the Ruby-name reader.
- [ ] **`delegate :queue_adapter, to: :class`**: the instance reader reads the class's current adapter at call time.

## Acceptance criteria

- [ ] All four files read complete in `parity:api` (in-process `autoload` lines only).
- [ ] `QueueAdapters.lookup("sidekiq")` raises the `NameError` a Ruby process without the gem raises; nothing returns a stub.
- [ ] The `inline` lane runs with the ported setup file.

## Definition of done

Stub classes for the gem adapters, or a `queue_adapter` getter that does not default to `:async`, do not close this story.
