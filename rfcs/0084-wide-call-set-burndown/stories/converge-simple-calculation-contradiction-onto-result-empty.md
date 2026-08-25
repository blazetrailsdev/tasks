---
title: "Fold execute_simple_calculation's contradiction arm through Result.empty"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6438
claim: "2026-08-12T21:36:51Z"
assignee: "hoist-nokogirisax-hash-builder-to-module-scope"
blocked-by: null
closed-reason: null
---

## Context

PR #6434 gave `executeSimpleCalculation`
(`packages/activerecord/src/relation/calculations.ts`) the contradictory
where-clause arm Rails has at
`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:487-497`:

```ruby
query_result = if relation.where_clause.contradiction?
  ActiveRecord::Result.empty
else
  ... select_all ...
end

query_result.then do |result|
  if operation != "count"
    type = column.try(:type_caster) || lookup_cast_type_from_join_dependencies(...) || Type.default_value
    type = type.subtype if Enum::EnumType === type
  end
  type_cast_calculated_value(result.cast_values.first, operation, type)
end
```

Rails builds a real `Result.empty` and folds it through the SAME
`type_cast_calculated_value(result.cast_values.first, operation, type)` call the
executed arm uses. trails short-circuits with
`typeCastCalculatedValue(null, operation, null)` — right answers (count/sum fold
to 0, the rest to nil), wrong shape: the value and the resolved type are both
hard-coded rather than read off a result, so the arm cannot pick up a column
type's `deserialize` the way Rails' does. It ships as an `args` baseline row
(`execute_simple_calculation type_cast_calculated_value(ref:first, ref:operation, ref:type)`)
in `scripts/api-compare/call-mismatches-exclude/activerecord/relation/calculations.json`.

## Converged shape

Have the contradiction arm produce `Result.empty` (`packages/activerecord/src/result.ts`)
and flow into the same fold as the executed arm — one `type_cast_calculated_value`
call site reading `result.castValues()[0]` and the type resolved by
`column.type_caster || lookup_cast_type_from_join_dependencies || Type.default_value`
(with the `Enum::EnumType` subtype unwrap, calculations.rb:504-508). The
`singleAggregate` helper already resolves that type as `colType`, so the two arms
should meet there rather than each casting for itself.

## Acceptance criteria

- [ ] The contradiction arm builds an empty `Result` and folds through the shared
      `typeCastCalculatedValue` call.
- [ ] `where(col: []).count/sum/average/minimum/maximum` keep their current
      values (0, 0, null, null, null) and still issue no query.
- [ ] The `execute_simple_calculation type_cast_calculated_value` args row is
      deleted by hand from the exclude baseline; `pnpm parity:api:calls:args` green.
