---
title: "CTE array values → Arel::Nodes::UnionAll AST (build_with_expression_from_value)"
status: done
updated: 2026-06-11
rfc: "0022-relation-arel-ast-convergence"
cluster: cte
deps: []
deps-rfc: []
est-loc: 450
priority: 1
pr: 3135
claim: "2026-06-11T21:13:58Z"
assignee: "cte-build-with-expression-ast"
blocked-by: null
---

## Context

Cluster 1 of the RFC. Today `resolveCteEntry`
(`packages/activerecord/src/relation/query-methods.ts` ~L225–266) resolves a CTE
value to a **SQL string**: for an array it maps each sub-query to `q.toSql()` and
`.join(" UNION ALL ")` (the `" UNION " → " UNION ALL "` string fix from PR #3105),
and `_ctes` stores `{ name, sql, recursive }` with `sql` a raw string. `buildWith`
(~L2492) then re-wraps that string via `new Nodes.Cte(c.name, arelSql(c.sql))`.

Rails resolves the value to an **arel expression** in
`build_with_expression_from_value`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb` L1929):

```ruby
when Arel::Nodes::SqlLiteral then Arel::Nodes::Grouping.new(value)
when ActiveRecord::Relation
  nested ? value.arel.ast : value.arel
when Arel::SelectManager then value
when Array
  return build_with_expression_from_value(value.first, false) if value.size == 1
  parts = value.map { |q| build_with_expression_from_value(q, true) }
  parts.reduce { |result, v| Arel::Nodes::UnionAll.new(result, v) }
```

The arel infrastructure already exists: `Nodes.UnionAll`
(`packages/arel/src/nodes/binary.ts` L223, exported in `nodes/index.ts` L58),
`SelectManager#unionAll` (`packages/arel/src/select-manager.ts` L502), and the
SQLite visitor's `Grouping`-stripping `infixValueWithParen`
(`packages/arel/src/visitors/sqlite.ts` L89, tested in `sqlite.test.ts`).

## Scope

- Port `build_with_expression_from_value` so a CTE value resolves to an arel
  expression: single-element array unwraps; multi-element array `reduce`s into
  left-nested `Nodes.UnionAll`; `Relation` contributes `value.arel` (`.ast` when
  nested); a raw SQL string / `SqlLiteral` becomes `Nodes.Grouping`.
- Change `_ctes` to carry the resolved arel expression (keep `name` / `recursive`);
  update `buildWith` to build the `Nodes.Cte` over that expression and delete the
  `arelSql(c.sql)` string re-wrap so the **visitor** renders the body.
- Keep `resolveCteEntry`'s existing name/identifier and null/empty-array argument
  validation (the raise messages are asserted in `with.test.ts`).

## Rails source

- `query_methods.rb` `build_with_expression_from_value` (L1929) and `build_with`
  (caller, ~L1900).
- arel `nodes/binary.rb` `UnionAll`.

## Test assertions

- `vendor/rails/activerecord/test/cases/relation/with_test.rb` —
  `test_with_when_passing_arrays` (duplicates across parts preserved by UNION ALL;
  expected = `(SPECIAL_POSTS + POSTS_WITH_TAGS + POSTS_WITH_COMMENTS).sort`),
  single-element array unwrap, `with_recursive`, and the arg-validation raises.
- trails mirror: `packages/activerecord/src/relation/with.test.ts` (PR #3105) —
  all currently-passing cases must stay green; no test renames.

## Acceptance criteria

- [ ] `_ctes` stores an arel expression, not a SQL string; `buildWith` no longer
      calls `arelSql()` on a CTE body.
- [ ] Array CTE values reduce into nested `Nodes.UnionAll`; single-element arrays
      unwrap; `SqlLiteral`/raw-string values become `Nodes.Grouping`.
- [ ] `pnpm vitest run packages/activerecord/src/relation/with.test.ts` passes
      (no weakened assertions); arg-validation raise messages unchanged.
- [ ] SQLite emits no parens around UNION ALL operands (existing `Grouping`
      strip); PG/MySQL unchanged. `test:compare` for `with_test.rb` delta ≥ 0.

## Notes

- The SQLite paren/`Grouping` handling and PG/MySQL behavior are already covered
  by the arel visitors — this story only changes the activerecord side.
- If the diff exceeds 500 LOC, ship the array/`UnionAll` reduction first and
  register a continuation for the `Relation`/`SelectManager` value branches via
  `pnpm tasks new`.
