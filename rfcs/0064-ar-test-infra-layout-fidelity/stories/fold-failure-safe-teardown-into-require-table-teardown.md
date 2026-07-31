---
title: "fold-failure-safe-teardown-into-require-table-teardown"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5701
claim: "2026-07-31T01:51:02Z"
assignee: "fold-failure-safe-teardown-into-require-table-teardown"
blocked-by: null
closed-reason: null
---

## Context

`scripts/bespoke-tables-inventory/inventory.ts` (added by
`drop-bespoke-tables-per-file-like-rails`) measures the one dimension the
`blazetrails/require-table-teardown` ESLint rule does not model: _where_ the
`dropTable` sits. The rule (`eslint/require-table-teardown.mjs`, an AST rule
with an empty exclude list) already proves every created table is dropped
somewhere in the file; it does not distinguish a drop in an
`afterEach`/`afterAll`/`finally` from one at the end of an `it` body, which a
failing assertion above it skips — stranding the table in the shared
per-worker database. Rails gets this for free from `teardown`:
`vendor/rails/activerecord/test/cases/migration_test.rb:53-67` (a `teardown do`
dropping `things awesome_things prefix_things_suffix p_awesome_things_s`) and
`:1231-1233` (`teardown { drop_table(:delete_me) rescue nil }`).

The script is regex-based and carries its own `REVIEWED` allowlist of five
reviewed-benign entries. The rule already has the AST, the SQL-sink scanning
(`eslint/sql-call-shapes.mjs`), and the per-name create/drop bookkeeping this
needs — folding the check in there deletes the script and puts the check on
every commit instead of on demand.

## Acceptance criteria

- Add a `failureSafe` option (default on) to `blazetrails/require-table-teardown`
  that reports a created table whose only drop is outside an
  `afterEach`/`afterAll`/`finally`.
- Port the five `REVIEWED` entries from the script, each keeping its reason,
  either as inline `eslint-disable-next-line` comments with the reason or as a
  documented exclude file entry.
- Delete `scripts/bespoke-tables-inventory/` and its `bespoke:tables:inventory`
  package.json script once the rule covers it.
- Rule tests in `eslint/require-table-teardown.test.mjs` for both polarities.
