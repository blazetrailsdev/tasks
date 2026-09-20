---
title: "attributes-dirty-attribute-mutation-needs-in-place-string-mutation"
status: closed
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
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
closed-reason: "duplicate of assertions-immutable-js-string-values — same root cause (Ruby String is mutable, a JS string is an immutable primitive); attributes_dirty_test.rb:66-72 'attribute mutation' is parked under that story's BLOCKED receipt as an eighth row alongside attribute_test.rb's mutation and dup parks"
---

## Context

Parked by the assertion-parity convergence of
`packages/activemodel/src/attributes-dirty.test.ts` (RFC 0132).

Rails' `AttributesDirtyTest#test_attribute_mutation`
(`vendor/rails/activemodel/test/cases/attributes_dirty_test.rb:66-72`) is:

```ruby
@model.name = "Yam"
@model.save
assert_not_predicate @model, :name_changed?
@model.name.replace("Hadad")
assert_predicate @model, :name_changed?
```

It asserts that an **in-place mutation of the attribute's String object** is
picked up by `changed_in_place?` — `ActiveModel::Dirty` re-serializes the
current value and compares it to the value the attribute was created from
(`activemodel/lib/active_model/attribute.rb:104-107`,
`attribute_mutation_tracker.rb:41-48`).

Ruby's `String#replace` mutates the receiver. JS strings are immutable and there
is no `String#replace` twin in `ruby-compat`, so the mutation step is not
expressible: the ported line
`(model.name as unknown as { replace(other: string): void }).replace("Hadad")`
calls `String.prototype.replace`, which returns a new string and leaves the
attribute untouched, so `nameChanged()` stays `false`.

The test is landed with the converged body — 2 assertions,
`assertNotPredicate` and `assertPredicate`, matching Rails'
`assert_not_predicate` / `assert_predicate` — and parked as `it.skip` with a `BLOCKED:` line naming this
story. `dirty_test.rb`'s own `attribute mutation` test is NOT affected — its
trails port drives the same state through `nameWillChange()`, which Rails' body
also calls (`dirty_test.rb:91-98`).

## Acceptance criteria

- [ ] Decide whether trails can express Ruby `String#replace` for an attribute
      value at all — either a mutable string value object that the string type's
      `serialize` round-trips, or a ratified statement that in-place String
      mutation has no JS counterpart.
- [ ] If expressible: un-skip `attribute mutation` in
      `packages/activemodel/src/attributes-dirty.test.ts` with its assertions
      unchanged, and drop the `BLOCKED:` line.
- [ ] If not expressible: record the decision where the other ratified
      language-shortcoming decisions live (`CLAUDE.md`) and leave the park in
      place with the receipt pointing there instead of at this story.
- [ ] `pnpm parity:test -- --package activemodel --assertions` still reports
      0 assertion mismatches for `attributes_dirty_test.rb`.
