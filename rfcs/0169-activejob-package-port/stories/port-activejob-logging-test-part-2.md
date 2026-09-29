---
title: "Port logging_test.rb cases 23\u201345 (:271-495)"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
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

The second half: enqueue errors, perform errors, retry / discard logging (`RescueJob`, `RetryJob`), `verbose_enqueue_logs` source lines, and `enqueue_all` messages.

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/logging_test.rb`: 23 cases, as `parity:test` names them:

- [ ] `:271` LoggingTest — "for tagged logger support is consistent"
- [ ] `:278` LoggingTest — "job error logging"
- [ ] `:287` LoggingTest — "job no error logging on rescuable job"
- [ ] `:294` LoggingTest — "enqueue retry logging"
- [ ] `:302` LoggingTest — "enqueue retry logging on retry job"
- [ ] `:308` LoggingTest — "retry stopped logging"
- [ ] `:315` LoggingTest — "retry stopped logging without block"
- [ ] `:324` LoggingTest — "discard logging"
- [ ] `:331` LoggingTest — "enqueue all job logging some jobs failed enqueuing"
- [ ] `:342` LoggingTest — "enqueue all job logging all jobs failed enqueuing"
- [ ] `:353` LoggingTest — "verbose enqueue logs"
- [ ] `:362` LoggingTest — "verbose enqueue logs disabled by default"
- [ ] `:367` LoggingTest — "enqueue all job logging"
- [ ] `:372` LoggingTest — "enqueue all graceful failure when enqueued count is nil"
- [ ] `:391` LoggingTest — "enqueue log level"
- [ ] `:403` LoggingTest — "enqueue at log level"
- [ ] `:415` LoggingTest — "enqueue all log level"
- [ ] `:426` LoggingTest — "perform start log level"
- [ ] `:437` LoggingTest — "perform log level"
- [ ] `:449` LoggingTest — "enqueue retry log level"
- [ ] `:461` LoggingTest — "enqueue retry log level on retry job"
- [ ] `:473` LoggingTest — "retry stopped log level"
- [ ] `:485` LoggingTest — "discard log level"

## Fidelity traps (predicted at authoring)

- [ ] The `unless adapter_is?(:inline, :sneakers)` block at `:293` runs only in the `test` / `async` lanes.

## Acceptance criteria

- [ ] All 23 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
