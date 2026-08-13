---
title: "port-relation-sum-block-arm"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6471
claim: "2026-08-13T15:55:42Z"
assignee: "port-relation-sum-block-arm"
blocked-by: null
closed-reason: null
---

## Context

`drop-perform-sum-nil-column-short-circuit` removed `performSum`'s trails-only
`if (!column) return 0` guard and converged the signature onto Rails'
`sum(initial_value_or_column = 0, &block)`
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:171-177`):

```ruby
def sum(initial_value_or_column = 0, &block)
  if block_given?
    map(&block).sum(initial_value_or_column)
  else
    calculate(:sum, initial_value_or_column)
  end
end
```

The `block_given?` arm is still unported: trails' `performSum`
(`packages/activerecord/src/relation/calculations.ts:848`) has only the
`calculate` arm, so `Model.sum(r => r.age)` and `Model.sum(1000, r => r.age)`
— load the relation, map the block over the records, and sum the results onto
the initial value — are not available.

Note the identity default is `0`, not `nil`: `Model.sum()` sums the SQL literal
`0` through `aggregate_column` → `arel_column`'s `field.to_s`
(query_methods.rb:1993), which is what makes the no-argument answer 0 without a
pre-`calculate` branch.

## Acceptance criteria

- [ ] `performSum` takes an optional block and, when given one, loads the
      relation, maps the block over the records, and sums onto
      `initialValueOrColumn` (calculations.rb:171-177).
- [ ] The non-block arm is unchanged.
- [ ] Rails' own coverage for the block form is enrolled if it exists in
      `vendor/rails/activerecord/test/cases/calculations_test.rb`.
