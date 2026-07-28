---
title: "port-migration-foreign-key-validate-constraints-cases"
status: ready
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
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

`ActiveRecord::Migration::ForeignKeyTest` defines **two** cases named
`test_add_invalid_foreign_key`, on the two arms of
`if supports_validate_constraints?`
(`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:452-535`):

- the `if` arm (PG) expects `assert_not_predicate fk, :validated?` after
  `validate: false`, alongside `test_validate_foreign_key_*`,
  `test_validate_constraint_by_name` and
  `test_schema_dumping_with_validate_false` / `_true`;
- the `else` arm (MySQL/SQLite) expects `assert_predicate fk, :validated?`.

None of that block is ported. #5486 (port-migration-foreign-key-deferrable-cases)
attempted the `else` arm alone and had to back it out: the Ruby gate extractor
drops the negation, so the `else` case extracts as `features=[foreign_keys]`
while the `if` case extracts as `features=[foreign_keys,validate_constraints]`,
and with only one TS test present the matcher pairs it with the
`validate_constraints` entry — `test:compare --gates --check` reports
`[wrong-gate] "add invalid foreign key"` and exits 1.

Porting **both** arms together is what resolves it: add a
`validate_constraints: ["postgres"]` key to
`packages/activerecord/src/support/supports.ts` (Rails'
`supports_validate_constraints?` is PostgreSQL-only), express the `if` arm as
`itIfSupports("validate_constraints", "add invalid foreign key", …)` and the
`else` arm as a plain `it` with `.skipIf(adapterType === "postgres")` if the
matcher then pairs them correctly — verify with `pnpm test:compare --gates`.

Target file: `packages/activerecord/src/migration/foreign-key.test.ts`
(setup is the shared `withRocketTables`; no new schema needed). Note trails'
`ForeignKeyDefinition` exposes Rails' `validated?` as the getter `isValidated`
(`connection-adapters/abstract/schema-definitions.ts:324`).

## Acceptance criteria

- [ ] The `supports_validate_constraints?` block of `foreign_key_test.rb` is
      ported in full, both arms of `test_add_invalid_foreign_key` included,
      names verbatim.
- [ ] `pnpm test:compare --gates --check` stays at exit 0 — in particular no
      `[wrong-gate]` entry for `add invalid foreign key`.
- [ ] `test:compare` delta for `foreign_key_test.rb` is strictly positive.
- [ ] Green on all three adapters.
