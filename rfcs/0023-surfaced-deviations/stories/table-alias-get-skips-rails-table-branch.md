---
title: "TableAlias#get skips Rails' is_a?(Table) branch and duplicates alias resolution"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while doing `arel-table-type-cast-fallbacks-are-invented` (PR #4888),
which converged the `TableAlias` type-cast delegators but deliberately left
`get()` alone as out of scope.

Rails' `TableAlias#[]` branches on the relation's class
(`arel/nodes/table_alias.rb:11-13`):

```ruby
def [](name)
  relation.is_a?(Table) ? relation[name, self] : Attribute.new(self, name)
end
```

The `Table` branch delegates to `Table#[]`'s **two-arg** form
(`arel/table.rb:#[]` — `def [](name, table = self)`), passing `self` (the alias)
as the attribute's relation. trails' `TableAlias#get`
(`packages/arel/src/nodes/table-alias.ts`) does neither branch: it reaches into
`relation.klass._attributeAliases` itself and always returns
`new Attribute(this, resolved)`.

`Table#get(name, table?)` already accepts the second arg, so the Rails shape is
available — the delegation just is not used.

## Why it matters

Attribute-alias resolution is duplicated between `Table#get` and
`TableAlias#get` instead of living in `Table#get` and being reached through
delegation. The two copies can drift, and the non-`Table` branch (a
`SelectManager` relation, i.e. `manager.as("x")` derived tables) is currently
indistinguishable from the `Table` branch.

Probed during #4888: the derived-table case is live — `users.project(...).as("dt").get("id")`
driven through `HomogeneousIn#castedValues` raises
`this.relation.typeForAttribute is not a function`, which is faithful (Rails
raises `NoMethodError` there too), but it confirms both branches are reachable.

## Acceptance criteria

- [ ] `TableAlias#get` mirrors `table_alias.rb:11-13`: delegate to
      `relation.get(name, this)` when the relation is a `Table`, else
      `new Attribute(this, name)`.
- [ ] Attribute-alias resolution lives in `Table#get` only — the duplicate
      `_attributeAliases` lookup in `table-alias.ts` goes away.
- [ ] Self-join alias coverage (`where("clients.new_name": …)`, the case the
      current comment cites) stays green.
- [ ] No test name changes. api:compare / test:compare delta non-negative.
