---
title: "converge-cte-body-arel-node-to-relation-arel"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6611
claim: "2026-08-16T20:53:32Z"
assignee: "converge-references-values-to-sql-literals"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `build_with` in #6607. Rails'
`build_with_expression_from_value` (activerecord/lib/active_record/relation/
query_methods.rb:1929-1948) resolves a Relation body with the public reader:

```ruby
when ActiveRecord::Relation
  if nested
    value.arel.ast
  else
    value.arel
  end
```

trails calls a trails-only bridge instead (`relation/query-methods.ts`,
`buildWithExpressionFromValue`):

```ts
const node = (value as any)._cteBodyArelNode(nested);
return node ?? (Arel.sql((value as any).toSql()) as unknown);
```

`Relation#_cteBodyArelNode` (`packages/activerecord/src/relation.ts:4091`) has
no Rails counterpart. It ignores `nested` (both arms answer the AST node,
because trails' `Cte`/`UnionAll` operands must be visitable nodes), and it
returns `null` for a relation whose SQL `buildArel` cannot fully encode — an
eager-loading body — which drops the caller onto a pre-rendered
`Arel.sql(value.toSql())` literal, freezing adapter quoting and bind collection
at `toSql()` time. Rails has no such fallback: `value.arel` always answers.

Both halves converge once `build_arel` covers the eager-load body
(`0107/converge-relation-build-arel-single-builder` lists `_cteBodyArelNode` at
`:5529` among the invented compile path's callers) and once `Cte`/`UnionAll`
accept a `SelectManager` operand the way Arel's do.

## Acceptance criteria

- [ ] `buildWithExpressionFromValue`'s Relation arm reads `value.arel()` /
      `value.arel().ast` per `nested`, matching query_methods.rb:1931-1936.
- [ ] `Relation#_cteBodyArelNode` is deleted along with its `toSql()` fallback.
- [ ] `with.test.ts` (including the array/UNION ALL and recursive cases) and
      `with.trails.test.ts` stay green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
