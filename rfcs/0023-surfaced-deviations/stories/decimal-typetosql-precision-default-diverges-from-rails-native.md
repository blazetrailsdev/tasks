---
title: "typeToSql defaults decimal precision to 10 instead of Rails' native nil"
status: claimed
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-02T03:38:22Z"
assignee: "decimal-typetosql-precision-default-diverges-from-rails-native"
blocked-by: null
---

## Context

Surfaced by PR #4378 (fix-defineschema-materialization-precision-scale-limit-roundtrip).

trails' `SchemaCreation#typeToSql`
(`packages/activerecord/src/connection-adapters/abstract/schema-creation.ts`) is
a hand-written `switch` that defaults decimal precision to 10
(`DECIMAL(${options.precision ?? 10}, ...)`), whereas Rails' `type_to_sql`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1385-1409`)
sources the default from `native_database_types[:decimal][:precision]` — `nil`
for SQLite/MySQL — so a precision-less `t.decimal :decimal_number` emits a bare
`decimal` with no `(N)`.

Effect: canonical `numeric_data.decimal_number` (declared bare `decimal`)
materializes as `DECIMAL(10)` and now (post-#4378, once precision round-trips)
dumps as `t.decimal("decimal_number", { precision: 10 })` where Rails dumps a
bare `t.decimal "decimal_number"`. A round-trip fidelity divergence.

## Acceptance criteria

- [ ] Precision-less decimal columns materialize without a `(N)` clause
      (matching Rails' `native_database_types`-driven default), so they dump
      bare on SQLite.
- [ ] `numeric_data.decimal_number` / `numeric_number` dump with no precision.
- [ ] test:compare non-negative; no regression in existing decimal dump cases.
