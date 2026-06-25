---
title: "updateall-parenthesize-subquery-value"
status: in-progress
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: 4126
claim: "2026-06-25T14:54:37Z"
assignee: "updateall-parenthesize-subquery-value"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

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
