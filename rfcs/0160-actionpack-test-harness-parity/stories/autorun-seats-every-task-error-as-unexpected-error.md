---
title: "autorun seats every vitest task error as UnexpectedError; Minitest keeps an Assertion as itself"
status: done
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8408
claim: "2026-10-02T16:02:00Z"
assignee: "autorun-seats-every-task-error-as-unexpected-error"
blocked-by: null
closed-reason: null
---

## Context

Found while shipping trails PR 8373.

`Minitest::Test#run` captures a test body's exception by class (`vendor/minitest/v5.27.0/lib/minitest/test.rb:190-198`):

```ruby
rescue Assertion => e
  self.failures << e
rescue Exception => e
  self.failures << UnexpectedError.new(sanitize_exception e)
```

So `error?` (`vendor/minitest/v5.27.0/lib/minitest.rb:639-641`) is false for a failed assertion and true for a raised exception, and `failures` holds the exception objects themselves.

trails' runner (`packages/activesupport/src/testing/autorun.ts`, the `afterEach`) seats the vitest task's state on the test case before `afterTeardown()`. It pushes `new UnexpectedError(e)` for EVERY entry of `task.result.errors`. vitest has already run each thrown value through `processError`, so an entry is a plain object: `e instanceof Error` and `e instanceof Assertion` are both false. Two consequences:

- A failed `Assertion` is seated as an `UnexpectedError`, so `isError()` answers true where Minitest answers false.
- `failures` holds a wrapper around a serialized copy, not the exception the body raised.

## Converged shape

The runner captures the body's exception itself, with Minitest's two arms: an `Assertion` goes onto `failures` as is, anything else as `UnexpectedError.new(e)`. That needs the raised value before vitest serializes it (the runner wrapping the test body, or vitest's `onTestFailed` / task-context error if it exposes the original).

## Acceptance criteria

- After a test body raises an `Assertion`, `testCase.failures[0]` is that object and `testCase.isError()` is false; after any other raise it is an `UnexpectedError` whose `error` is the raised object.
- Covered by a `.trails.test.ts` beside `autorun.ts`.
- `TestsWithoutAssertions`' warning still stays quiet for a test that raised.
