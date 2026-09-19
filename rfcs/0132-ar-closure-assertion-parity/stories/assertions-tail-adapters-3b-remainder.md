---
title: "assertions-tail-adapters-3b-remainder"
status: draft
updated: 2026-09-19
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
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

Remainder of assertions-tail-adapters-3b after trails PR converging set, sp, numbers, utils, ltree, pg virtual_column.
Remaining files (under vendor/rails/activerecord/test/cases/): connection_adapters/registration_test.rb, adapters/postgresql/{full_text,transaction,bit_string,transaction_nested,statement_pool,case_insensitive}\_test.rb, adapters/sqlite3/virtual_table_test.rb, connection_adapters/{adapter_leasing,connection_swapping_nested}\_test.rb, adapters/mysql2/check_constraint_quoting_test.rb, adapters/abstract_mysql_adapter/optimizer_hints_test.rb.
Re-measure with `pnpm parity:test -- --package activerecord --assertions --missing`.

## Acceptance criteria

- Each remaining file reports 0 count/kind/value mismatches; do not touch the frozen mark file.
