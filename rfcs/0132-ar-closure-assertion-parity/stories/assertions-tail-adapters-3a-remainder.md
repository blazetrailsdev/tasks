---
title: "assertions-tail-adapters-3a-remainder"
status: done
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#7904
claim: "2026-09-20T18:48:00Z"
assignee: "assertions-tail-adapters-3a-remainder"
blocked-by: null
closed-reason: null
---

## Context

Remainder of assertions-tail-adapters-3a. `pnpm parity:test -- --package activerecord --assertions --missing` still lists mismatches in: postgresql/{foreign_table,network,infinity,referential_integrity,deferred_constraints,extension_migration,json,serial,composite,citext,active_schema}\_test.rb, abstract_mysql_adapter/{mysql_explain,schema,nested_deadlock}\_test.rb, sqlite3/{transaction,sqlite_rake}\_test.rb. postgresql/quoting_test.rb was converged (PG tests are not runnable locally; vitest excludes adapters/postgresql).

## Acceptance criteria

- Each listed file reports 0 count/kind/value mismatches; do not reseed the frozen mark.
