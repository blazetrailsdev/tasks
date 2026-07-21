---
title: "where-sql-wraps-in-and-and-returns-sqlliteral"
status: ready
updated: 2026-07-21
rfc: "0007-remove-global-arel-visitor"
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

Noticed while porting `Node#to_sql`'s engine argument (#5036), which threaded
`engine` through `SelectManager#whereSql` but deliberately left its body alone.

Rails (`vendor/rails/activerecord/lib/arel/select_manager.rb:192-196`):

```ruby
def where_sql(engine = Table.engine)
  return if @ctx.wheres.empty?

  Nodes::SqlLiteral.new("WHERE #{Nodes::And.new(@ctx.wheres).to_sql(engine)}")
end
```

trails (`packages/arel/src/select-manager.ts:375-381`) diverges twice:

1. It special-cases a single where (`wheres.length === 1 ? wheres[0] : new And(...)`)
   instead of always wrapping in `Nodes::And`. Rails wraps unconditionally, so a
   one-element `And` renders differently from a bare predicate wherever the
   visitor treats `And` specially.
2. It returns a plain `string | null`, not a `Nodes::SqlLiteral`. Callers that
   feed the result back into an AST get a raw string where Rails gets a node.

## Acceptance criteria

- [ ] `whereSql` always wraps `core.wheres` in `Nodes.And`, matching
      `select_manager.rb:195`.
- [ ] It returns a `SqlLiteral` (or `null`/`undefined` for the empty case,
      matching Ruby's bare `return`).
- [ ] Callers updated for the new return type.
- [ ] api:compare / test:compare delta non-negative.
