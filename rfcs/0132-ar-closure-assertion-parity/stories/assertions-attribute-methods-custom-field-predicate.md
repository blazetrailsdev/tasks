---
title: "assertions-attribute-methods-custom-field-predicate"
status: done
updated: 2026-09-16
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7826
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`attribute_methods_test.rb`'s `custom field attribute predicate`
(`vendor/rails/activerecord/test/cases/attribute_methods_test.rb:622-635`) is
the last convergeable assertion-parity row left in that file after the
`assertions-attribute-methods-test` port — the others are ratified language
shortcomings or the two members
`port-class-side-attribute-method-and-allocate` covers.

Rails selects two aliased columns through raw SQL and then exercises the
generated predicates over them:

```ruby
object = Company.find_by_sql(<<~SQL).first
  SELECT c1.*, c2.type as string_value, c2.rating as int_value
    FROM companies c1, companies c2
   WHERE c1.firm_id = c2.id
     AND c1.id = 2
SQL

assert_equal "Firm", object.string_value
assert_predicate object, :string_value?
object.string_value = "  "
assert_not_predicate object, :string_value?
assert_equal 1, object.int_value.to_i
assert_predicate object, :int_value?
object.int_value = "0"
assert_not_predicate object, :int_value?
```

Six assertions (`equal` ×2, `truthy` ×2, `falsy` ×2). The trails counterpart
(`packages/activerecord/src/attribute-methods.test.ts`) is still a bespoke
`class Topic extends Base` placeholder asserting one thing, reported as
`rails 6 vs trails 1` by
`pnpm parity:test -- --package activerecord --assertions --missing`.

Left out of the port PR only because it would have pushed that PR past its LOC
ceiling.

## Acceptance criteria

- `custom field attribute predicate` is the Rails body over the canonical
  `Company` model and `findBySql`, with the same six assertions in the same
  order and the same kinds.
- `attribute_methods_test.rb` reports one fewer assertion-count and one fewer
  assertion-kind mismatch; `scripts/test-compare/assertion-mismatch-mark.json`
  is lowered by `pnpm parity:test:assertions:reseed`.
- No test name changes.
