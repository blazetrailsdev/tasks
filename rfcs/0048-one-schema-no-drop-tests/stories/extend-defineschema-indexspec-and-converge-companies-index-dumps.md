---
title: "extend-defineschema-indexspec-and-converge-companies-index-dumps"
status: ready
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `converge-schema-dumper-test-canonical-schema` (PR #4366), which
converged the `standard_dump` / `dump_table_schema` cases in
`packages/activerecord/src/schema-dumper.test.ts` onto the canonical
`TEST_SCHEMA` but had to leave the index-dump cases bespoke.

Rails' `schema.rb` `create_table :companies` declares six secondary/expression
indexes that the schema-dumper tests assert on
(`vendor/rails/activerecord/test/schema/schema.rb`, companies block):

- `t.index [:name, :rating], order: :desc`
- `t.index [:name, :description], length: 10`
- `t.index [:firm_id, :type, :rating], name: "company_index", length: { type: 10 }, order: { rating: :desc }`
- `t.index [:firm_id, :type], name: "company_partial_index", where: "(rating > 10)"`
- `t.index [:firm_id], name: "company_nulls_not_distinct", nulls_not_distinct: true`
- `t.index :name, name: "company_name_index", using: :btree`
- expression index gated on `supports_expression_index?`

`defineSchema`'s `IndexSpec` (`packages/activerecord/src/test-helpers/define-schema.ts`)
only supports `columns` / `unique` / `where` / `name` — it cannot express
`order`, `length` (scalar or per-column map), `nulls_not_distinct`, `using`, or
`type`. So canonical `companies` cannot carry these indexes, and the following
`SchemaDumperTest` cases remain on ad-hoc `companies`/`users` tables:
`schema dumps index columns in right order`, `schema dumps partial indices`,
`schema dumps nulls not distinct`, `schema dumps index sort order`,
`schema dumps index length`, `schema dump expression indices`.

## Acceptance criteria

- [ ] Extend `IndexSpec` + `defineSchema`'s index emission with `order`,
      `length`, `nullsNotDistinct`, `using`, and `type`, matching Rails' `t.index`
      option surface (adapter-gated where the DDL requires, e.g. sub-part length
      is MySQL-only, nulls-not-distinct is PG≥15-only).
- [ ] Add the six canonical `companies` indexes to `TEST_SCHEMA`, matching Rails'
      schema.rb names/options exactly.
- [ ] Converge the six index-dump `SchemaDumperTest` cases onto canonical
      `companies` via `dumpTableSchema`, matching Rails' expected index lines.
- [ ] Watch for suite-wide fallout: adding indexes changes the `companies`
      schema signature; verify sibling files that ride `companies` still pass.
- [ ] test:compare non-negative.
