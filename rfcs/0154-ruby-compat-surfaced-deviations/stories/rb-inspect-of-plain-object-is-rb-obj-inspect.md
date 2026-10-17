---
title: "rb-inspect-of-plain-object-is-rb-obj-inspect"
status: ready
updated: 2026-10-17
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Kernel#inspect` is `rb_obj_inspect` (`vendor/ruby/v3.3.11/object.c`):
with instance variables it answers `#<Person:0x… @id="9">`, else
`rb_any_to_s`; since Ruby 2.0 it never calls `to_s`. ruby-compat's
`inspectValue` (`packages/ruby-compat/src/object.ts`, the
`typeof value === "object"` arm) answers `rbObjAsString(value)` whenever that is a
string, and for a plain class instance with no `toS` that is JS
`toString()`'s `[object Object]`, so `rbObjInspect` (which already builds the
ivar form) is never reached.

Surfaced by the codegen spike: activejob `test_helper_test.rb`
"assert enqueued with failure with global id args" and four siblings match
`/Potential matches:.*Person.* @id="9"/` against
`ActiveJob::TestHelper`'s message, which interpolates jobs whose args hold a
`Person` (`test/models/person.rb`, `@id`).

## Acceptance criteria

- `rbInspect` of an object with no `inspect` member answers `rbObjInspect(obj)`
  (`#<Person … @id="9">`), not its JS `toString()`.
- An object that ports `to_s` but not `inspect` still inspects by
  `rb_obj_inspect`, as in MRI.
- A regression test on a plain class instance with one field, failing today.
