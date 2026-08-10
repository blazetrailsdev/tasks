---
title: "port-final-check-constraint-test-cases"
status: done
updated: 2026-08-09
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6227
claim: "2026-08-08T10:27:54Z"
assignee: "port-final-check-constraint-test-cases"
blocked-by: null
closed-reason: null
---

## Context

PR for `port-remaining-check-constraint-test-cases` took
`packages/activerecord/src/migration/check-constraint.test.ts` from 7/25 to
20/25 matched in `pnpm parity:test`. Five Rails cases in
`vendor/rails/activerecord/test/cases/migration/check_constraint_test.rb`
remain unported, each because it needs setup the ported file does not yet have:

- `test_check_constraints` (check_constraint_test.rb:43-84) — reads the
  canonical `products` check constraint, then has a MySQL-only arm that
  `add_check_constraint`s a `json_schema_valid(...)` expression against a
  `constraint_test` table (created in Rails' setup at :27-31, not created by our
  `beforeEach`), and a PostgreSQL-only arm for a `CASE WHEN` expression. Note
  `json_schema_valid` is MySQL 8.0.17+ and absent on MariaDB, which is what the
  CI mysql lane runs — check that arm against the lane before porting.
- `test_check_constraints_scoped_to_schemas` (:86-99) — PostgreSQL-only, needs
  `create_schema`/`drop_schema`.
- `test_schema_dumping_with_validate_false` (:194-200) and
  `test_schema_dumping_with_validate_true` (:202-208) — need the
  `SchemaDumpingHelper` harness (`dump_table_schema`), gated on
  `supports_validate_constraints?` (PostgreSQL).

The scaffolding to reuse is already in the file: `describe("Migration")` >
`describeIfSupports("check_constraints", "CheckConstraintTest", …)`,
`ambientConnection()`, the `trades`/`purchases` `beforeEach`/`afterEach`, and a
`Trade` model. Feature gates come from `support/supports.ts`
(`itIfSupports("validate_constraints", …)`).

## Acceptance criteria

- [ ] The five cases above ported, names in prose form matching Rails verbatim.
- [ ] `pnpm parity:test --package activerecord` shows
      `migration/check_constraint_test.rb` at 25/25; 0 gate mismatches.
- [ ] `constraint_test` created/dropped under the same `current_adapter?` gating
      Rails uses, and both arms of every `current_adapter?` branch ported.
