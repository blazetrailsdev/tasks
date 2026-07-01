---
title: "Converge schema-dumper.test.ts faithful port onto canonical TEST_SCHEMA + fixtures"
status: in-progress
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 4366
claim: "2026-07-01T03:24:45Z"
assignee: "converge-schema-dumper-test-canonical-schema"
blocked-by: null
---

## Context

Follow-up to `converge-schema-dumper-test-faithful-port` (PR #4357), which
de-hybridized `packages/activerecord/src/schema-dumper.test.ts` by relocating
all trails-only cases into `schema-dumper.trails.test.ts`, leaving the file as a
pure Rails-named port of `vendor/rails/activerecord/test/cases/schema_dumper_test.rb`.

That PR deliberately did NOT satisfy acceptance criterion 2 of the parent story:
the retained `SchemaDumperTest` / `SchemaDumperDefaultsTest` cases still build
bespoke ad-hoc tables via `MigrationContext.createTable` (e.g. `users`, `strict`,
`limits`, `dump_defaults`, `numeric_data`, `companies` with force:true, etc.) plus
a hand-rolled `afterAll` drop list — rather than riding canonical `TEST_SCHEMA` +
official models + real fixtures. Rails' schema_dumper_test.rb dumps the standard
loaded test schema (`dump_table_schema("companies")` etc.), not per-test ad-hoc
tables. This bespoke-table pattern is exactly what RFC 0048 / RFC 0019 target.

Splitting that convergence into its own story keeps PR #4357 a clean, reviewable
mechanical relocation (it already exceeded the 500-LOC ceiling as pure code
motion; folding in a schema rewrite would have blown it far past).

## Acceptance criteria

- [ ] Convert `SchemaDumperTest` / `SchemaDumperDefaultsTest` cases in
      `schema-dumper.test.ts` to ride canonical `TEST_SCHEMA`
      (`test-helpers/test-schema.js`) + official models + real fixtures wherever
      the Rails source dumps a canonical table (e.g. `companies`), matching
      Rails table/column names exactly. Drop the bespoke `createTable` + manual
      `afterAll` drop list where canonical tables replace them.
- [ ] Where a Rails case genuinely needs a non-schema.rb table, mirror Rails
      (its migration/fixture), not an invented shape.
- [ ] No `_tableName` hack; no bespoke columns.
- [ ] test:compare stays at 67/67 matched (non-negative); fix impl or file a
      deviation under 0023-surfaced-deviations for any surfaced gap.
- [ ] 500-LOC ceiling; single PR from main.

## Notes

- Pre-existing documented gate-mismatch to preserve or converge here: the
  `schema dump expression indices escaping` case is a PG/SQLite port whereas
  Rails gates it MySQL-only (current_adapter?(:Mysql2,:Trilogy)). Annotated in
  the file today; decide converge-or-track when touching this file.
