---
title: 'PredicateBuilder#expand_from_hash returns the String "1=0", not a SqlLiteral'
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while landing `activerecord-signatures-take-the-arel-node-union` (trails#8405).

Rails' `PredicateBuilder#expand_from_hash` returns the String `"1=0"` for an empty hash:

```ruby
def expand_from_hash(attributes, &block)
  return ["1=0"] if attributes.empty?
```

(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/predicate_builder.rb:84-85`)

trails returns an `Arel::Nodes::SqlLiteral`: `if (entriesOf(attributes).length === 0) return [sql("1=0")]` (`packages/activerecord/src/relation/predicate-builder.ts`, `expandFromHash`). So the predicate a `where({})`-shaped call stores in its `WhereClause` is a `SqlLiteral` where Rails stores a plain String. `WhereClause` already handles a String predicate (`wrap_sql_literal`, `invert_predicate`'s `when String`, `relation/where_clause.rb:163-172`, `:190-196`), and trails' `where-clause-string-predicates.trails.test.ts` covers that path.

trails#8405 typed the return `(Nodes.Node | Nodes.SqlLiteral)[]` to describe what the body returns today. The converged type is `(Nodes.Node | string)[]`, which is also what `build_from_hash` and `grouping_queries` then carry.

## Acceptance criteria

- [ ] `expandFromHash` returns `["1=0"]` for an empty hash, and `buildFromHash` / `expandFromHash` / `groupingQueries` are typed `(Nodes.Node | string)[]`.
- [ ] A trails test pins that the stored predicate is a String and that the SQL is unchanged (`WHERE (1=0)`); it fails on the current body.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
