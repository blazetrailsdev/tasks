---
title: "MariaDB columns() loses FLOAT vs DOUBLE limit (use SHOW FULL FIELDS)"
status: in-progress
updated: 2026-07-04
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 4539
claim: "2026-07-04T03:27:32Z"
assignee: "mariadb-float-limit-columns-show-full-fields"
blocked-by: null
---

## Context

Surfaced by converge-mysql-adapter-ddl-one-schema (PR #4330). The MySQL
`schema_test.rb` port's `test_float_limits`
(`packages/activerecord/src/adapters/abstract-mysql-adapter/schema.test.ts`) is
`it.skipIf(isMariaDb)` and tracked-pending-convergence: on MariaDB a bare
`FLOAT` is normalized to `DOUBLE` in `information_schema.columns`
(`column_type = 'double'`), so `lookupCastType` returns `limit = 53` instead of
the declared `24`. Rails avoids this by reading column types via
`SHOW FULL FIELDS FROM`, which preserves the declared type name. trails'
`columns()` reads `information_schema.columns`, losing the distinction.

Fix is a `columns()` refactor on the MySQL adapter to source the declared type
(e.g. via SHOW FULL FIELDS) so float limit 0..24 vs 25..53 round-trips on
MariaDB, then un-skip the MariaDB branch of `test_float_limits`.

## Acceptance criteria

- [ ] MySQL adapter `columns()` reports the declared float precision on MariaDB
      (limit 24 for FLOAT, 53 for DOUBLE), matching Rails.
- [ ] Un-skip the `isMariaDb` branch of `test_float_limits`; it passes on both
      MySQL and MariaDB.
- [ ] No regression to other MySQL/MariaDB column-introspection tests.
