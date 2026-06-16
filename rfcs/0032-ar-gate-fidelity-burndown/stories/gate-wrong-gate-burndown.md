---
title: "Converge wrong-gate tests to Rails gates (49 across 19 files)"
status: draft
updated: 2026-06-16
rfc: "0032-ar-gate-fidelity-burndown"
cluster: wrong-gate
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC `ar-gate-fidelity-burndown`, cluster `wrong-gate`. `test:compare --package
activerecord --gates` (2026-06-16) reports **49 `wrong-gate`** mismatches across
19 files: both Rails and our TS port gate the test, but to **different**
adapter/feature sets (`adapterFeatureKey(rails) != adapterFeatureKey(ts)`).

Per-file counts (kind == `wrong-gate`):

```text
 6  transaction_isolation_test.rb
 5  migration_test.rb / adapters/sqlite3/sqlite3_adapter_test.rb /
    adapters/postgresql/postgresql_adapter_test.rb / adapters/postgresql/optimizer_hints_test.rb
 4  adapters/postgresql/schema_test.rb
 3  schema_dumper_test.rb / adapters/abstract_mysql_adapter/virtual_column_test.rb
 2  adapters/abstract_mysql_adapter/connection_test.rb / view_test.rb
 1  adapter_test.rb / insert_all_test.rb / dirty_test.rb / invertible_migration_test.rb /
    adapters/postgresql/uuid_test.rb / adapters/postgresql/foreign_table_test.rb /
    adapters/postgresql/virtual_column_test.rb /
    adapters/abstract_mysql_adapter/optimizer_hints_test.rb /
    adapters/mysql2/check_constraint_quoting_test.rb
```

## Acceptance criteria

- [ ] For each `wrong-gate` test, change the TS gate so its adapter set + feature
      predicate **exactly matches `railsGate`** (source kind may differ).
- [ ] Where converging surfaces an impl gap, keep Rails' gate, mark pending, and
      register a follow-up story; note IDs here.
- [ ] `test:compare --package activerecord --gates` reports **0 `wrong-gate`**
      for the files this story closes.
- [ ] Test names unchanged.

## Notes

These concentrate in adapter-specific dirs and feature-flag tests
(`transaction_isolation`, `optimizer_hints`, `virtual_column`). Common cause:
TS gates to one adapter where Rails gates to a `supports_*?` feature that spans
several, or vice versa. Diff `railsGate` vs `tsGate` in the JSON per test.
