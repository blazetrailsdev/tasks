---
title: "unpark the debug_exceptions invalid-mime-type test and drop UnexpectedError's class-name arm"
status: ready
updated: 2026-10-23
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `raise Klass` with no message builds the exception with a `nil` message,
and `Exception#message` (`exc_message`, `vendor/ruby/v3.3.11/error.c:3303`)
sends `to_s`, which answers the class name (`exc_to_s`, `error.c:1463`).

That core arm has landed: trails#9022 (story
`exception-message-defaults-to-class-name`) made ruby-compat's
`Exception#toS` answer the class path for a message-less exception and put a
`message` getter over it (`packages/ruby-compat/src/exception.ts:28-66`).
`StandardError extends Exception` (`standard-error.ts:11`), so every ported
error class inherits it.

Two leftovers still reflect the old `""` default:

- `ActionDispatch::DebugExceptions#log_error` logs
  `"#{wrapper.exception_class_name} (#{wrapper.message})"`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/debug_exceptions.rb:139-145`),
  and `debug_exceptions_test.rb:579-600` ("doesn't log the framework backtrace
  when error type is a invalid mime type") expects
  `ActionDispatch::Http::MimeNegotiation::InvalidType (ActionDispatch::Http::MimeNegotiation::InvalidType)`.
  The port is still `it.skip` under `// BLOCKED: exception-without-message-reads-class-name`
  at `packages/actionpack/src/action-dispatch/dispatch/debug-exceptions.test.ts:684-685`.
  `InvalidType` is `class InvalidType extends MimeType.InvalidMimeType` with its
  prototype `name` set (`packages/actionpack/src/action-dispatch/http/mime-negotiation.ts:11-12`),
  and it is seated at `:198`.
- Minitest's `UnexpectedError#message` (`packages/activesupport/src/testing/assertions.ts:283-292`)
  still special-cases a message-less error with
  `Object.hasOwn(this.error, "message") ? this.error.message : classNameOf(this.error)`.
  For a ruby-compat `Exception` the getter already answers the class name, so
  the arm is invented. A non-ruby-compat JS `Error` (`message === ""`) is the
  only case it changes, and Minitest reads `error.message` there too.

Absorbs `standard-error-message-does-not-default-to-class-name` (closed as a
duplicate).

## Acceptance criteria

- [ ] The parked debug_exceptions test runs un-skipped with its Rails body and
      passes; its `BLOCKED:` line is deleted. If the logged message is still
      `()`, find where `InvalidType` is raised without a message and fix that
      raise rather than the test.
- [ ] `UnexpectedError#message` interpolates `this.error.message` with no
      `Object.hasOwn` / `classNameOf` arm, as Minitest's
      `"#{self.error.class}: #{self.error.message}\n    #{bt}"` does
      (`vendor/minitest/v5.27.0/lib/minitest.rb:1099-1103`), and
      `ExceptionsInsideAssertionsTest` stays green.
