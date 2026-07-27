---
title: "Remove the invented ActiveRecordError arm from typeCondition"
status: draft
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #5378 (converge-inheritance-column-reader-onto-ported-nullable),
which routed every caller onto the nullable `Model.inheritanceColumn` reader
and deleted `getInheritanceColumn` / `inheritanceColumnDisabled`.

One call site had no Rails-shaped null arm: `typeCondition`
(`packages/activerecord/src/inheritance.ts`, `type_condition` — Rails
`activerecord/lib/active_record/inheritance.rb:322-327`):

```ruby
def type_condition(table = arel_table)
  sti_column = table[inheritance_column]
  sti_names  = ([self] + descendants).map(&:sti_name)
  predicate_builder.build(sti_column, sti_names)
end
```

Rails does no nil check — with `inheritance_column = nil` it would index the
arel table with nil. trails cannot, because the reader is typed
`string | null` and `table.get()` needs a string, so #5378 added a defensive
`throw new ActiveRecordError("Cannot build type condition without an
inheritance column")`. That error has no Rails counterpart.

The arm is unreachable today: `finder_needs_type_condition?` is false whenever
the column is nil (`descends_from_active_record?` returns true), and every
caller gates on it. So this is invented surface guarding a state that cannot
occur, not a behavioral divergence.

## Acceptance criteria

- Remove the invented `ActiveRecordError` throw from `typeCondition`, or
  replace it with a narrowing that carries the non-null column from the
  `finderNeedsTypeCondition?` gate so no Rails-less error text exists.
- No new error class or message that Rails does not raise.
- `typeCondition` stays in `inheritance.ts` at its Rails-layout position.
- api:compare and test:compare deltas non-negative.
- STI suites pass: inheritance.test.ts, inheritance-namespaced.test.ts,
  sti-attribute-routing.test.ts.
