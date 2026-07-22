---
title: "attribute.test.ts: strengthen toContain OR/AND assertions to Rails' exact SQL"
status: ready
updated: 2026-07-22
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After #5057/#5066 consolidated duplicate describes in
`packages/arel/src/attributes/attribute.test.ts`, three surviving blocks still
assert weaker than Rails' `must_be_like` exact-SQL form:

- `#gt_any` "should generate ORs in sql" — `toContain("OR")`; Rails
  `vendor/rails/activerecord/test/cases/arel/attributes/attribute_test.rb:120-127`
  asserts the full `SELECT ... WHERE ("users"."id" > 1 OR "users"."id" > 2)`.
- `#not_eq_all` "should generate ANDs in sql" — `toContain("AND")`; Rails
  rb:~40-47 asserts full SQL.
- `#not_eq_any` "should generate ORs in sql" — `toContain("OR")`; Rails
  asserts full SQL.

The #5066 method (fold exact `toSql()` in place of `toContain`) applies
directly; these three just had no duplicate block carrying the exact copy.

## Acceptance criteria

- The three its assert the exact Rails SQL via `toSql()`/`must_be_like`
  equivalent.
- No test renamed. test:compare matched count for attributes/attribute_test.rb
  stays at 128.
