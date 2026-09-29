---
title: "Port logging_test.rb cases 1\u201322 (:59-270)"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-log-subscriber",
    "port-activesupport-log-subscriber-test-helper",
    "port-activejob-exceptions",
    "port-activejob-test-helper-performed-assertions",
    "port-activejob-globalid-argument-arm",
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

`vendor/rails/v8.0.2/activejob/test/cases/logging_test.rb` (495 lines) includes `ActiveJob::TestHelper` and `ActiveSupport::LogSubscriber::TestHelper` (`:18-19`) and defines a `TestLogger` (`:22-50`). It is split at `test_for_tagged_logger_support_is_consistent` (`:271`). This half covers tagging, argument logging and GlobalID parameter logging.

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/logging_test.rb`: 22 cases, as `parity:test` names them:

- [ ] `:59` LoggingTest — "uses active job as tag"
- [ ] `:64` LoggingTest — "uses job name as tag"
- [ ] `:71` LoggingTest — "uses job id as tag"
- [ ] `:78` LoggingTest — "logs correct queue name"
- [ ] `:87` LoggingTest — "globalid parameter logging"
- [ ] `:97` LoggingTest — "globalid nested parameter logging"
- [ ] `:107` LoggingTest — "enqueue job logging"
- [ ] `:115` LoggingTest — "enqueue job log error when callback chain is halted"
- [ ] `:123` LoggingTest — "enqueue job log error when error is raised during callback chain"
- [ ] `:136` LoggingTest — "perform job logging"
- [ ] `:147` LoggingTest — "perform job logging when job is not enqueued"
- [ ] `:156` LoggingTest — "perform job log error when callback chain is halted"
- [ ] `:161` LoggingTest — "perform job doesnt log error when job returns falsy value"
- [ ] `:172` LoggingTest — "perform job doesnt log error when job is performed multiple times and fail the first time"
- [ ] `:190` LoggingTest — "perform disabled job logging"
- [ ] `:202` LoggingTest — "perform nested jobs logging"
- [ ] `:217` LoggingTest — "enqueue at job logging"
- [ ] `:226` LoggingTest — "enqueue at job log error when callback chain is halted"
- [ ] `:234` LoggingTest — "enqueue at job log error when error is raised during callback chain"
- [ ] `:248` LoggingTest — "enqueue in job logging"
- [ ] `:257` LoggingTest — "enqueue log when enqueue error is set"
- [ ] `:264` LoggingTest — "enqueue at log when enqueue error is set"

## Fidelity traps (predicted at authoring)

- [ ] Three blocks are `unless adapter_is?(:inline, :sneakers)` (`:216`, `:247`); port the guards as-is — they run in the `test` and `async` lanes.
- [ ] Message regexes port to equivalent JS `RegExp`s without loosening; `%r{…}` Ruby regex syntax (`\A`, `\z`) must be translated, not copied.

## Acceptance criteria

- [ ] All 22 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
