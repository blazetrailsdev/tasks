---
title: "updateall-parenthesize-subquery-value"
status: ready
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`Relation#updateAll` (`packages/activerecord/src/relation.ts`, the
`updateValues` mapping ~L3651) renders an `Arel.sql(...)` (`SqlLiteral`) update
value verbatim into the `SET col = <value>` clause. When the value is a scalar
subquery, the emitted SQL is `SET cars_count = select count(*) ...`, which
SQLite (and other adapters) reject with a syntax error — a scalar-subquery
expression must be parenthesized.

Rails' Arel UPDATE visitor parenthesizes such an assignment value, so the
faithful Rails test `test_update_all_with_custom_sql_as_value`
(`activerecord/test/cases/persistence_test.rb`) passes a bare
`Arel.sql(<<~SQL) select count(*) from cars where cars.person_id = people.id SQL`
with no parens.

Surfaced by `persistence-test-canonical-wave12` (PR #3846): the ported
`update all with custom sql as value` test had to add explicit parens to the
`arelSql(...)` literal to produce valid SQL, deviating from the verbatim Rails
heredoc. See the comment at that test for the marker.

## Acceptance criteria

- [ ] `Relation#updateAll` parenthesizes a subquery `SqlLiteral` update value so
      the generated SQL matches Rails (`SET col = (select ...)`), letting the
      faithful Rails heredoc (no explicit parens) round-trip on SQLite/MySQL/PG.
- [ ] Update the `update all with custom sql as value` test in
      `persistence.test.ts` to use the verbatim Rails SQL (drop the in-test parens
      and the convergence-marker comment).
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      lint + typecheck clean; test:compare delta non-negative.
