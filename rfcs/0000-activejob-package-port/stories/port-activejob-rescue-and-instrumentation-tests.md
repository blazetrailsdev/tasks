---
title: "Port rescue_test.rb and instrumentation_test.rb (10 cases)"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob"]
deps:
  [
    "port-activejob-exceptions",
    "port-activejob-globalid-argument-arm",
    "port-activejob-test-fixture-jobs",
  ]
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rescue_test.rb` drives `RescueJob` (`rescue_from` + `retry_job`) and a `Person.new(404)` argument whose locator lookup fails into `DeserializationError`. `instrumentation_test.rb` subscribes with `ActiveSupport::Notifications.subscribed` (`:52-54`, already async in trails).

Pure test port against already-ported lib code: keep every Rails name (a `def test_x` maps to `"x"`), port each assertion without loosening it, and build expected Ruby `inspect` text with `rbInspect`.

`vendor/rails/v8.0.2/activejob/test/cases/rescue_test.rb`: 5 cases, as `parity:test` names them:

- [ ] `:12` RescueTest — "rescue perform exception with retry"
- [ ] `:18` RescueTest — "let through unhandled perform exception"
- [ ] `:25` RescueTest — "rescue from deserialization errors"
- [ ] `:32` RescueTest — "should not wrap DeserializationError in DeserializationError"
- [ ] `:37` RescueTest — "rescue from exceptions that don't inherit from StandardError"

`vendor/rails/v8.0.2/activejob/test/cases/instrumentation_test.rb`: 5 cases, as `parity:test` names them:

- [ ] `:14` InstrumentationTest — "perform_now emits perform events"
- [ ] `:21` InstrumentationTest — "perform_later emits an enqueue event"
- [ ] `:27` InstrumentationTest — "retry emits an enqueue retry event"
- [ ] `:34` InstrumentationTest — "retry exhaustion emits a retry_stopped event"
- [ ] `:42` InstrumentationTest — "discard emits a discard event"

## Fidelity traps (predicted at authoring)

- [ ] `"should not wrap DeserializationError in DeserializationError"` passes `[Person.new(404)]`: the error from the nested array element must surface once, with the locator's error as `cause`.
- [ ] `"rescue from exceptions that don't inherit from StandardError"` raises `NotImplementedError` (a `ScriptError`), which `rescue_from` must still catch.

## Acceptance criteria

- [ ] All 10 cases listed above are ported under their Rails names and pass in every lane their `adapter_is?` guards allow.

## Definition of done

Renaming a test or weakening an assertion does not close this story. A case that fails on a lib bug is fixed in the same PR; if the fix is over budget, the case may be skipped only with a skip reason naming a story filed in this RFC for the bug.
