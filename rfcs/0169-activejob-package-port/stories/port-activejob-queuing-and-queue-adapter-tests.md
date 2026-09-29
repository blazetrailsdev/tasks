---
title: "Port queuing_test.rb, queue_adapter_test.rb and adapter_test.rb's portable case (19 cases)"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-enqueuing-and-configured-job",
    "port-activejob-instrumentation",
    "port-activejob-test-adapter",
    "port-activejob-test-fixture-jobs",
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

`adapter_test.rb`'s two `sucker_punch` cases are recorded as unported by `enroll-activejob-in-compare-tooling`. `queue_adapter_test.rb` defines stub adapter classes (`:5-18`) and resets `Base.queue_adapter` around each case.

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/queuing_test.rb`: 12 cases, as `parity:test` names them:

- [ ] `:15` QueuingTest — "run queued job"
- [ ] `:20` QueuingTest — "run queued job with arguments"
- [ ] `:25` QueuingTest — "run queued job later"
- [ ] `:32` QueuingTest — "job returned by enqueue has the arguments available"
- [ ] `:37` QueuingTest — "job returned by perform_at has the timestamp available"
- [ ] `:44` QueuingTest — "job is yielded to block after enqueue with successfully_enqueued property set"
- [ ] `:53` QueuingTest — "when enqueuing raises an EnqueueError job is yielded to block with error set on job"
- [ ] `:60` QueuingTest — "run multiple queued jobs"
- [ ] `:65` QueuingTest — "run multiple queued jobs passed as array"
- [ ] `:70` QueuingTest — "run multiple queued jobs of different classes"
- [ ] `:75` QueuingTest — "perform_all_later enqueues jobs with schedules"
- [ ] `:88` QueuingTest — "perform_all_later instrumentation"

`vendor/rails/v8.0.2/activejob/test/cases/queue_adapter_test.rb`: 6 cases, as `parity:test` names them:

- [ ] `:20` QueueAdapterTest — "should forbid nonsense arguments"
- [ ] `:25` QueueAdapterTest — "should allow overriding the queue_adapter at the child class level without affecting the parent or its sibling"
- [ ] `:54` QueueAdapterTest — "should default to :async adapter if no adapters are set at all"
- [ ] `:67` QueueAdapterTest — "should extract a reasonable name from a class instance"
- [ ] `:80` QueueAdapterTest — "should extract a reasonable name from a class or module"
- [ ] `:94` QueueAdapterTest — "should use the name provided by the adapter"

`vendor/rails/v8.0.2/activejob/test/cases/adapter_test.rb`: 1 case, as `parity:test` names them:

- [ ] `:6` AdapterTest — "should load adapter"

## Fidelity traps (predicted at authoring)

- [ ] `"should load  adapter"` interpolates `ENV['AJ_ADAPTER']`; it asserts the adapter's full Ruby class name per lane.
- [ ] `"should default to :async adapter if no adapters are set at all"` exercises the lazy `:async` default (`queue_adapter.rb:35`).

## Acceptance criteria

- [ ] All 19 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
