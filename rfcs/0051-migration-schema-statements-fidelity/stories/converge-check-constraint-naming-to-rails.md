---
title: "converge-check-constraint-naming-to-rails"
status: draft
updated: 2026-07-04
rfc: "0051-migration-schema-statements-fidelity"
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

Surfaced in review of PR #4535 (invertible-migration-revert-engine-gaps).
trails has TWO check-constraint name generators that disagree:

- `SchemaStatements._checkConstraintName(tableName, expression)`
  (`connection-adapters/abstract/schema-statements.ts:890`) — a bitwise hash
  producing `chk_<table>_<hex8>`. **This is a deviation from Rails.** It is what
  `addCheckConstraint` (schema-statements.ts:846), the reversal path in
  `removeCheckConstraint` (schema-statements.ts:874), and the change_table
  builder (`schema-definitions.ts:1008,1058`) actually use — so add/remove are
  self-consistent, but the generated DB name is non-Rails.
- `SchemaStatements.checkConstraintName(tableName, {name, expression})`
  (schema-statements.ts:~2413) — sha256 `chk_rails_<hex10>`, **matching Rails**
  `check_constraint_name` (`abstract/schema_statements.rb`). It is consumed by
  the already-built-but-unused `checkConstraintFor`/`checkConstraintForBang`
  (schema-statements.ts:~2428), the check-constraint twin of the FK
  `foreignKeyForBang` that `removeForeignKey` now uses.

Because `addCheckConstraint` names un-named constraints with the bitwise
`chk_<table>_<hex8>`, `removeCheckConstraint` cannot resolve them live via
`checkConstraintForBang` (which derives `chk_rails_<hex10>` and won't match) —
attempting that raised `ArgumentError: no check constraint for <expr>` in
PR #4535. A constraint dumped from a real Rails schema (`chk_rails_...`) also
can't be removed by expression through trails today.

## Acceptance criteria

- [ ] Converge `addCheckConstraint` (base + change*table `schema-definitions.ts`
      paths) to name un-named constraints via the Rails-faithful
      `checkConstraintName` (sha256 `chk_rails*<hex10>`), retiring
`\_checkConstraintName`.
- [ ] `removeCheckConstraint` resolves the live constraint via
      `checkConstraintForBang(table, { name, expression }).name` and drops that,
      mirroring `removeForeignKey`/`foreignKeyForBang` — no name derivation.
- [ ] Handle expression-normalization in the lookup (PG stores `(expr)`); match
      on the derived/explicit name, not a raw-expression string compare.
- [ ] No regression in schema-dumper / invertible-migration / migration suites
      on every adapter lane; update any dumped `chk_` names.
