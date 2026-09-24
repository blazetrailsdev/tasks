---
title: "assertCalledWith mock messages: format args via inspect like minitest (JSON.stringify crashes on records)"
status: done
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8044
claim: "2026-09-24T17:44:04Z"
assignee: "activesupport-time-with-zone-subnanosecond-fractions"
blocked-by: null
closed-reason: null
---

## Context

`assertMock` in `packages/activesupport/src/testing/method-call-assertions.ts` formats a mismatch as
`Expected call with ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`. When an argument is an
ActiveModel record (as in `i18n-validation.test.ts`'s `generateMessage` expectations, which pass `person`),
`JSON.stringify` reaches `toJSON` → `this.asJson is not a function` and the assertion fails with a
`TypeError` instead of a `MockExpectationError`. The extra-call arm (added in #7946) uses `String(arg)`
as a stopgap.

Minitest formats both with `%p` / `inspect`: `vendor/minitest/lib/minitest/mock.rb:161` ("No more expects
available for %p: %p %p") and `mock.rb:212-225` (the "mocked method %p called with unexpected arguments %p"
raise).

## Acceptance criteria

- [ ] Both messages format arguments through a Ruby-`inspect` port (not `JSON.stringify` / `String`), matching minitest's message text.
- [ ] A mismatch whose argument is a model raises `MockExpectationError`, covered in `method-call-assertions.trails.test.ts`.
