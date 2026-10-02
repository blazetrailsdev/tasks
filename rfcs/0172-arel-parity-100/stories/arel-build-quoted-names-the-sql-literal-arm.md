---
title: "arel: buildQuoted names the SqlLiteral arm (casted.rb:50)"
status: draft
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Arel::Nodes.build_quoted`
(`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/casted.rb:48-60`) passes six
classes through unquoted, and names `Arel::Nodes::SqlLiteral` as its own arm:

```ruby
when Arel::Nodes::Node, Arel::Attributes::Attribute, Arel::Table, Arel::SelectManager, Arel::Nodes::SqlLiteral, ActiveModel::Attribute
  other
```

trails' `buildQuoted` (`packages/arel/src/nodes/casted.ts`) tests five:
`Node`, `Attributes.Attribute`, `Arel.Table`, `Arel.SelectManager`,
`ModelAttribute`. The `SqlLiteral` arm is missing. It is invisible today only
because `SqlLiteral` extends `Node`. When
`arel-attribute-and-sql-literal-are-not-nodes` takes it off `Node`, a
`SqlLiteral` falls through to `new Quoted(other)` and renders as a quoted
string, with no type error: trails PR 8400 removed the `as ArelNode` cast, so
the return type is whatever the `instanceof` chain narrows to.

## Acceptance criteria

- [ ] `buildQuoted` tests `other instanceof Nodes.SqlLiteral` in Rails' arm
      order (`casted.rb:50`), between `Arel.SelectManager` and `ModelAttribute`.
- [ ] Its return type includes `SqlLiteral` by narrowing, not by a cast.
- [ ] Lands before, or in, `arel-attribute-and-sql-literal-are-not-nodes`.
