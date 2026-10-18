---
title: "exception-message-defaults-to-class-name"
status: in-progress
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#9022
claim: "2026-10-18T01:10:27Z"
assignee: "exception-message-defaults-to-class-name"
blocked-by: null
closed-reason: null
---

## Context

MRI's `Exception#to_s` (`vendor/ruby/v3.3.11/error.c:1463-1469` `exc_to_s`) answers the
class name when no message was given (`if (NIL_P(mesg)) return
rb_class_name(CLASS_OF(exc))`), and `Exception#message` (`error.c:3303`
`exc_message`) calls `to_s`. So `raise DefaultsError` (`Klass.exception` →
`new` with no argument) has `message == "DefaultsError"`.

ruby-compat's `Exception` (`packages/ruby-compat/src/exception.ts:14`) is a bare
`class Exception extends Error {}`, so `new FooError().message` is `""`. Rails
code and tests that read the message of an argument-less raise diverge:
activejob's `after_discard` / `retry_on` blocks log `error.message`
(`vendor/rails/v8.0.2/activejob/test/jobs/after_discard_retry_job.rb`,
asserted in `activejob/test/cases/exceptions_test.rb` "#after_discard ..." tests).
Surfaced by the Ruby→TS codegen spike, which works around it by passing the
class name.

## Acceptance criteria

- An `Exception` (and every subclass) constructed with no message answers its
  Ruby class name (`rbModName`, falling back to the JS name) from `message` and
  `toS`, as `exc_to_s` does; one constructed with a message keeps it.
- ruby-compat tests cover `new FooError().message` and a namespaced class.
- Existing ruby-compat and dependent package tests pass.
