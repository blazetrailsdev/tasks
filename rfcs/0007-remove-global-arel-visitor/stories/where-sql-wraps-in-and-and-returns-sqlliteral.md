---
title: "where-sql-wraps-in-and-and-returns-sqlliteral"
status: in-progress
updated: 2026-07-23
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5180
claim: "2026-07-23T21:32:09Z"
assignee: "where-sql-wraps-in-and-and-returns-sqlliteral"
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

Separately, `Relation#_conditionsClause` (`packages/activerecord/src/relation.ts:6503`)
is an `@internal` trails-only helper that **hand-rolls the same construction** —
including the identical `wheres.length === 1 ? wheres[0] : new Nodes.And(wheres)`
special-case — instead of calling `whereSql`. Rails' `raise_record_not_found_exception!`
(`finder_methods.rb:418`) simply does `arel.where_sql(model)`. The wide
call-mismatches ratchet flags this omission; it is baselined in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation/finder-methods.json`
with a pointer to this story, and that entry should be **removed** as part of the fix.

## Acceptance criteria

- [ ] `whereSql` always wraps `core.wheres` in `Nodes.And`, matching
      `select_manager.rb:195`.
- [ ] It returns a `SqlLiteral` (or `null`/`undefined` for the empty case,
      matching Ruby's bare `return`).
- [ ] Callers updated for the new return type.
- [ ] `_conditionsClause` calls `arel.whereSql(model)` rather than rebuilding the
      predicate, per `finder_methods.rb:418` — or is deleted in favour of inlining
      it at its two call sites, as Rails does.
- [ ] The `raise_record_not_found_exception!` / `where_sql` entry is dropped from
      the wide call-mismatches exclude file.
- [ ] api:compare / test:compare delta non-negative.
