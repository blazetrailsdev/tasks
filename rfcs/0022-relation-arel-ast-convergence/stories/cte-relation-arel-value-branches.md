---
title: "CTE Relation/SelectManager values → real value.arel (not pre-rendered SQL)"
status: claimed
updated: 2026-06-12
rfc: "0022-relation-arel-ast-convergence"
cluster: cte
deps: ["cte-build-with-expression-ast"]
deps-rfc: []
est-loc: 250
priority: 2
pr: null
claim: "2026-06-12T15:49:13Z"
assignee: "cte-relation-arel-value-branches"
blocked-by: null
---

## Context

Continuation of `cte-build-with-expression-ast` (PR #3135). That story ported
the array/`UnionAll` reduction and the `SqlLiteral`→`Grouping` branch of Rails'
`build_with_expression_from_value`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb` L1929),
but **deferred** the `ActiveRecord::Relation` and `Arel::SelectManager` value
branches:

```ruby
when ActiveRecord::Relation
  nested ? value.arel.ast : value.arel
when Arel::SelectManager then value
```

In #3135, `buildCteLeaf` (`packages/activerecord/src/relation/query-methods.ts`)
resolves a Relation/SelectManager leaf to `arelSql(value.toSql())` — a
**pre-rendered SQL string** wrapped as a bare `SqlLiteral`. This is behaviorally
correct (all `with_test.rb` cases pass, including `with_recursive` which needs
the relation's JOINs) but diverges from Rails' mechanism: Rails keeps the value
as an Arel object until visitor time, so adapter quoting, bind collection, and
the `nested` (`.arel` vs `.arel.ast`) shape are preserved through to the
visitor rather than frozen at `toSql()` time.

The blocker is that trails' live CTE rendering (`buildCteSql` in query-methods,
consumed by `relation.ts` `_toSqlWithoutSetOp` and `calculations.ts`
`prependCtes`) compiles each body node through the dialect visitor as a
standalone fragment, and trails' `Relation#toArel()` does **not** thread joins
(the recursive case needs them), while the full `buildArel`/`buildWith` arel
path is currently dead code. Threading a real `value.arel` for the Relation
branch requires either (a) extending `toArel()` to include joins/from/having so
it matches the live `_toSqlWithoutSetOp` output, or (b) wiring the live path
through `buildArel`.

## Acceptance criteria

- [ ] A `Relation` CTE value resolves to its actual Arel expression
      (`value.arel` non-nested, `value.arel.ast` nested) rather than
      `arelSql(value.toSql())`; an `Arel::SelectManager` value resolves to the
      manager/its `.ast`. Thread the `nested` flag through the array reduction
      exactly as Rails does.
- [ ] `with_recursive` (Relation with a string JOIN) still produces correct
      rows — the resolved Arel must include the relation's joins.
- [ ] `with.test.ts` stays green with no weakened assertions or renames;
      `test:compare` for `with_test.rb` delta ≥ 0.
- [ ] Bind values from a Relation CTE body are collected through the visitor
      (not inlined at `toSql()` time).
