---
title: "StandardError#message does not default to the class name (exc_to_s)"
status: draft
updated: 2026-09-24
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
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

Ruby's `Exception#message` → `exc_to_s` (`vendor/ruby/error.c`, `exc_to_s`) returns the class name when the exception was built without a message: `ArgumentError.new.message == "ArgumentError"`. ruby-compat's `StandardError` (`packages/ruby-compat/src/standard-error.ts`) extends JS `Error`, whose message defaults to `""`, so `new ArgumentError().message` is `""`.

trails#8018 handled this locally in the Minitest `UnexpectedError#message` getter (`packages/activesupport/src/testing/assertions.ts`, `Object.hasOwn(this.error, "message") ? ... : classNameOf(...)`). Every other reader of a no-argument error's message still diverges.

Converged shape: a `message` getter on `StandardError.prototype` that returns `this.name` (Ruby's class name). A message passed to the constructor is an own property and shadows the getter, just as a non-nil `mesg` does in `exc_to_s`. Then delete the local special case in `assertions.ts`.

## Acceptance criteria

- `new ArgumentError().message === "ArgumentError"`, and `new ArgumentError("").message === ""`.
- The `UnexpectedError#message` special case in `assertions.ts` is removed, and `ExceptionsInsideAssertionsTest` stays green.
- The whole suite is checked for tests that assert an empty message on a no-argument `StandardError` subclass.
