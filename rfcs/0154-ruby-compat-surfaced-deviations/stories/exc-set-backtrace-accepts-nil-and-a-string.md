---
title: "exc-set-backtrace-accepts-nil-and-a-string"
status: in-progress
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: trails#9042
claim: "2026-10-18T20:14:53Z"
assignee: "exc-set-backtrace-accepts-nil-and-a-string"
blocked-by: null
closed-reason: null
---

## Context

`excSetBacktrace(exc, bt: string[])` (`packages/ruby-compat/src/backtrace-location.ts:114`)
accepts only an Array of Strings. MRI's `Exception#set_backtrace` is
`exc_set_backtrace` → `rb_check_backtrace`
(`vendor/ruby/v3.3.11/error.c:1800-1820`), which also accepts `nil` (stored as
is) and a single String (wrapped as a one-element Array), and raises
`TypeError` "backtrace must be Array of String" for anything else, including an
Array holding a non-String.

ActiveJob's `DeserializationError#initialize` does `set_backtrace $!.backtrace`
(`vendor/rails/v8.0.2/activejob/lib/active_job/arguments.rb`), and an
exception's `backtrace` can be `nil`; the activejob codegen trial has to assert
it non-null to call the helper.

## Acceptance criteria

- `excSetBacktrace` accepts `null`, a string, or an array of strings, storing
  `null`, `[str]` and the array respectively, and `excBacktrace` reads each back
  as MRI does.
- Any other value, or an array with a non-string element, raises ruby-compat's
  `TypeError` with "backtrace must be Array of String".
- Each case is checked against MRI (ruby 3.3.11 on PATH).
