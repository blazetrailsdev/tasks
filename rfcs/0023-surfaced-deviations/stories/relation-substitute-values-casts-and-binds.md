---
title: "relation-substitute-values-casts-and-binds"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
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

Rails' `Relation#update_all` routes every value through `_substitute_values`
(`vendor/rails/activerecord/lib/active_record/relation.rb:1381-1393`):

```ruby
def _substitute_values(values)
  values.map do |name, value|
    attr = table[name]
    if Arel.arel_node?(value)
      value = Arel::Nodes::Grouping.new(value) if value.is_a?(Arel::Nodes::SqlLiteral)
    else
      type = model.type_for_attribute(attr.name)
      value = predicate_builder.build_bind_attribute(attr.name, type.cast(value))
    end
    [attr, value]
  end
end
```

Two things happen there that trails does not do: the value is **cast through the
column type**, and it is wrapped in a **bind attribute** — so `update_all` values
reach the database as bind params, never as inline-quoted literals.

trails has no `_substituteValues` (grep in `packages/activerecord/src/relation.ts`
and `packages/activerecord/src/relation/*.ts` returns nothing). Raw values are
placed into `Arel::Nodes::Assignment` and inline-quoted by the visitor
(`packages/arel/src/visitors/to-sql.ts` `visitArelNodesAssignment` →
`visitNodeOrValue`).

Surfaced by PR #4868: `default-scoping.test.ts`'s "sti association with unscoped
not affected by default scope" passed `updateAll({ deleted_at: new Date() })`,
which only worked because the Arel visitor formatted JS `Date` itself. Once
`ToSql#quote` delegated to the connection (per `to_sql.rb:867-870`), the adapter
applied AR's Temporal policy and raised. That test now passes
`Temporal.Now.instant()`, matching Rails' `update_all(deleted_at: Time.now)`
(`default_scoping_test.rb:611`) — but the underlying gap remains: an uncast value
of the wrong type is inline-quoted rather than cast-and-bound.

## Acceptance criteria

- [ ] `_substituteValues` is ported to `relation.ts`, casting each value via
      `typeForAttribute(name).cast(value)` and wrapping it in a bind attribute,
      matching `relation.rb:1381-1393`.
- [ ] `updateAll` values reach the DB as bind params, not inline literals.
- [ ] Arel-node values keep their pass-through, with `SqlLiteral` wrapped in
      `Nodes.Grouping` as Rails does.
- [ ] A value of the wrong type for its column (e.g. a string for a datetime) is
      cast by the column type rather than inline-quoted raw.
- [ ] api:compare / test:compare delta non-negative.
