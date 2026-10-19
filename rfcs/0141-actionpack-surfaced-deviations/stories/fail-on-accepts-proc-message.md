---
title: "failOn accepts a Proc message; drop assertRecognizes msg cast"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assertRecognizes` (`packages/actionpack/src/action-dispatch/testing/assertions/routing.ts`) now reassigns `msg = message(...)` as Rails does (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertions/routing.rb:179-185`). That widened its `msg` parameter to `string | (() => string)`, and the recursive arm and the `recognizedRequestFor(path, extras, msg)` call cast it back with `msg as string | undefined`. The cast exists because trails' `failOn` takes only a string. Rails' `fail_on(exception_class, message)` (`routing.rb:340-344`) raises `Minitest::Assertion, message || e.message`, and a Minitest assertion message may be a Proc.

## Acceptance criteria

- `failOn` and `recognizedRequestFor` accept the message shape `message()` returns, and a Proc message is resolved where Minitest resolves it.
- The `msg as string | undefined` cast in `assertRecognizes` is removed.
- The routing-assertions tests pass.
