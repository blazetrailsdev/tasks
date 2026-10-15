---
title: "exception-without-message-reads-class-name"
status: draft
updated: 2026-10-15
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `raise Klass` with no message builds the exception with a `nil` message,
and `Exception#message` (`exc_to_s`, `vendor/ruby/v3.3.11/error.c:1463`) then
answers the class name. `ActionDispatch::DebugExceptions#log_error` logs
`"#{wrapper.exception_class_name} (#{wrapper.message})"`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/debug_exceptions.rb:139-145`),
so `debug_exceptions_test.rb:579-600` ("doesn't log the framework backtrace when
error type is a invalid mime type") expects
`ActionDispatch::Http::MimeNegotiation::InvalidType (ActionDispatch::Http::MimeNegotiation::InvalidType)`.

In trails, `new InvalidType()` (any `ruby-compat` `Exception` subclass built with
no argument) has `message === ""`, the JS `Error` default, and `excToS`
(`packages/ruby-compat/src/exc-to-s.ts`) only falls back to the class name on a
`null` message, so the log reads `ActionDispatch::Http::MimeNegotiation::InvalidType ()`.
`ExceptionWrapper#message` (`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts`)
reads `exception.message` as Rails does.

The trails test is parked as `it.skip` in
`packages/actionpack/src/action-dispatch/dispatch/debug-exceptions.test.ts`.

## Acceptance criteria

- A `ruby-compat` `Exception` built with no message answers its Ruby class name
  from `message`, as `exc_to_s` does (`Exception.new.message == "Exception"`).
- The parked debug_exceptions test runs and passes.
