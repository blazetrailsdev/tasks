---
title: "arel: ToSql#unboundable? is split into a boolean and an invented unboundableSign helper"
status: draft
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: ["arel"]
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

Found while shipping trails PR 8378 (`arel-converge-invented-control-flow-arms`).

Rails has one private predicate, which returns the receiver's answer (`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/to_sql.rb:905-907`):

```ruby
def unboundable?(value)
  value.respond_to?(:unboundable?) && value.unboundable?
end
```

and its callers read the value: `case unboundable?(o.right) when 1 … when -1` in the four comparison visitors (`to_sql.rb:437-483`), `values.delete_if { |value| unboundable?(value) }` in `In` / `NotIn` (`to_sql.rb:594,611`).

`packages/arel/src/visitors/to-sql.ts` splits it in two: `isUnboundable(value): boolean` (`this.unboundableSign(value) !== 0`) and an invented `unboundableSign(value): 1 | -1 | 0`, which the comparison, equality and inequality visitors call instead. That is a value-returning Ruby predicate ported as a boolean plus a helper Rails does not have.

## Converged shape

`isUnboundable(value)` is the Rails expression, `rbObjRespondTo(value, "isUnboundable") && value.isUnboundable()`, returning `1 | -1 | false`; the comparison visitors switch on its value; `unboundableSign` is deleted.

## Acceptance criteria

- [ ] `ToSql#isUnboundable` is the single Rails expression and returns the receiver's value.
- [ ] `unboundableSign` is gone and every caller reads `isUnboundable`.
- [ ] `pnpm parity:api:calls`, `parity:api:predicates` and `parity:api:arms:report --package=arel` show no new row.
