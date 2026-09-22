---
title: "activemodel-errors-has-no-marshal"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `errors_test.rb`'s assertions (RFC 0132,
`assertions-activemodel-errors-cluster`).

`test "errors are marshalable"` (`vendor/rails/activemodel/test/cases/errors_test.rb:670-678`)
round-trips an `ActiveModel::Errors` through `Marshal.dump` / `Marshal.load` and
asserts the reloaded object's `@base` class, `messages` and `details` match the
original. trails has no `Marshal` and `packages/activemodel/src/errors.ts`
carries no `marshalDump` / `marshalLoad` pair, so there is nothing for the body
to call.

Parked `it.skip` with `BLOCKED: activemodel-errors-has-no-marshal` in
`packages/activemodel/src/errors.test.ts`, body converged to Rails' three
assertions and reaching the pair through a cast so the file typechecks.

Decide first whether a `Marshal` analogue belongs in trails at all; if it does
not, the story closes by converging the test onto whatever serialization trails
does offer, without softening the three assertions.

## Acceptance criteria

- `errors are marshalable` is un-skipped and passes, or the story is closed with
  the reasoning recorded and the test converged onto the trails equivalent.
