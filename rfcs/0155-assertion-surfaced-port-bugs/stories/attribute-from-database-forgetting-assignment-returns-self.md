---
title: "attribute-from-database-forgetting-assignment-returns-self"
status: ready
updated: 2026-09-22
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
closed-reason: null
---

## Context

Surfaced by `assertions-activemodel-attribute-cluster` (RFC 0132) while converging
`packages/activemodel/src/attribute.test.ts`.

Parked test: `#forgetting_assignment on an unchanged .from_database attribute
re-deserializes its value` (`packages/activemodel/src/attribute.test.ts`,
`it.skip` with `BLOCKED: attribute-from-database-forgetting-assignment-returns-self`).
Rails: `activemodel/test/cases/attribute_test.rb:287-305`.

Rails' `Attribute::FromDatabase#forgetting_assignment`
(`activemodel/lib/active_model/attribute.rb:176-188`) is:

```ruby
def forgetting_assignment
  if !defined?(@value_for_database) && !changed_in_place?
    with_value_from_database(value_before_type_cast)
  else
    super
  end
end
```

Both arms return a **new** attribute, so the test's
`assert_not_same original.value, forgotten.value` holds: the new attribute
re-deserializes `value_before_type_cast` and produces a second
`deserialized_value_class` instance.

trails' port (`packages/activemodel/src/attribute.ts:253-256`) is:

```ts
override forgettingAssignment(): Attribute {
  if (!this.changedInPlace()) return this;
  return super.forgettingAssignment();
}
```

Two divergences in three lines: the `!defined?(@value_for_database)` half of the
guard is dropped (so an attribute that HAS computed `value_for_database` still
takes the short branch), and the short branch returns `this` where Rails returns
`with_value_from_database(value_before_type_cast)`. The result is
`forgotten === original`, so the value is never re-deserialized and the parked
assertion fails.

How far this story got: the converged body is landed and parked; the fix is the
three-line port above plus whatever `_hasValueForDatabase` needs to stand in for
`defined?(@value_for_database)`. No production code was changed by the 0132 PR.

## Acceptance criteria

- [ ] `FromDatabase#forgettingAssignment` mirrors `attribute.rb:176-188`: both
      guard halves, and the non-`super` arm returns
      `withValueFromDatabase(valueBeforeTypeCast)`.
- [ ] The parked test is unparked with its assertions unchanged and passes.
- [ ] `pnpm parity:test -- --package activemodel --assertions` still reports 0
      count/kind/value mismatches for `attribute_test.rb`.
