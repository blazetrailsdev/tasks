---
title: "Converge Model construction to raise UnknownAttributeError for unknown keys"
status: draft
updated: 2026-06-23
rfc: "0046-strict-write-attribute-internal-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #4027 made `AttributeSet#writeFromUser` strict. The activemodel `Model`
constructor writes every key through `writeAttribute` directly (rather than
Rails' `assign_attributes` → `_assign_attribute` setter dispatch), so it now
catches and swallows the `MissingAttributeError` for not-yet-modeled names to
keep construction lenient.

Rails raises `UnknownAttributeError` for a genuinely-unknown construction key:
`ActiveModel::API#initialize` → `assign_attributes` (api.rb:80-82) →
`_assign_attribute` (attribute*assignment.rb:67-75) dispatches a writer or calls
`attribute_writer_missing` (→ `UnknownAttributeError`, attribute_assignment.rb:56-58);
ActiveRecord delegates from `Core#initialize` (core.rb:471-479). trails' broad
swallow is a deviation — though a PRE-EXISTING one: before #4027, the lazy
`write_from_user` \_stored* unknown keys rather than raising, so #4027 only
changed store→drop, not raise→drop.

A naive narrowing (swallow only writer-having keys, raise the rest) was
prototyped and breaks a cluster that ratified the leniency:
`base.test.ts > initialize with invalid attribute` (asserts "should not throw"),
`error.test.ts` Child, `persistence.test.ts` `authorName`, and the cpk-string
nested path (`nested-attributes.test.ts > updating models with cpk provided as
strings`) — the last is a legitimately-deferred composite-PK key with no setter.

## Acceptance criteria

- [ ] `Model`-construction of a genuinely-unknown key raises `UnknownAttributeError`
      like Rails (`new Topic({ invalid_attribute: "x" })`), via setter dispatch /
      `attribute_writer_missing` rather than the raw `writeAttribute` loop.
- [ ] Nested-attribute keys (`commentsAttributes`) and composite-PK string keys
      still construct (dispatched to their writers / deferred handling), not raised.
- [ ] Converge `base.test.ts > initialize with invalid attribute` to the Rails
      `basic_test.rb#test_initialize_with_invalid_attribute` expectation (rescue
      `UnknownAttributeError`, assert `e.attribute`), and fix the other
      leniency-dependent tests to pass real columns.
- [ ] Remove the broad swallow in `model.ts`'s constructor loop.
