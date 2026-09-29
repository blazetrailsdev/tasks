---
title: "Port logging_test.rb (45 cases)"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-exceptions-retry-and-discard",
    "port-activejob-test-helper-performed-assertions",
    "port-activejob-globalid-arguments-and-rescue-tests",
  ]
deps-rfc: []
est-loc: 550
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/test/cases/logging_test.rb` has 495 lines and 45
cases. It is the specification for `LogSubscriber`'s message formats and for
`tag_logger`'s tag nesting. It needs:

- `include ActiveJob::TestHelper` (`:18`), for `perform_enqueued_jobs` (27
  uses). That is why it depends on the performed-assertions story;
- `include ActiveSupport::LogSubscriber::TestHelper` (`:19`), which
  `port-activejob-instrumentation-and-log-subscriber` ports;
- `models/person` (`:15`), for the `gid://aj/Person/123` cases
  (`:87-105`), from the GlobalID story;
- `rescue_job`, `retry_job`, `abort_before_enqueue_job` and
  `enqueue_error_job`, from the exceptions and callbacks stories; and
  `logging_job`, `overridden_logging_job`, `nested_job` and `disable_log_job`,
  which land here if they are not already present (RFC "Canonical job
  fixtures").

Three blocks are `unless adapter_is?(:inline, :sneakers)` (`:216`, `:247`,
`:293`): the `enqueue_at` / `enqueue_in` logging cases. Port the guards as-is.
They execute in the `test` and `async` lanes that
`port-activejob-test-and-async-adapters` adds, so that story is also a
transitive dep here, through the performed-assertions story.

Message assertions use Ruby regexes (`assert_match(/Enqueued HelloJob \(Job
ID: .*\) to .*? at.*Cristian/, …)`). Port each one to the equivalent JS
`RegExp` without loosening it. Where the Ruby `inspect` of an argument appears
in a message (`format`, `log_subscriber.rb:154-165`), the expected text is
Ruby's `inspect`, through `rbInspect`.

If the port runs past 600 LOC, the agreed split point is
`test_for_tagged_logger_support_is_consistent` (`:271`): 22 cases before it
(`:59-270`) and 23 from it on (`:271-495`). File the tail as a sibling story.

## Acceptance criteria

- [ ] All 45 cases are ported under their Rails names (`def test_x` maps to
      `"x"` per test-compare's `def_test` rule).
- [ ] The `inline` lane runs 45 minus the guarded cases, and the `test` lane
      runs all 45.
- [ ] No assertion regex is weaker than its Ruby source.
