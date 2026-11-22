---
title: "activerecord-test-support-helper-stand-ins-remainder"
status: draft
updated: 2026-11-22
rfc: "0189-activerecord-surfaced-deviations"
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

Remainder of `activerecord-test-support-helper-stand-ins-and-harness` after its
PR converged `describeIfSqlite` / `describeIfPostgresqlAdapter` onto
`describe.runIf(currentAdapter(...))` (`currentAdapter` in
`packages/activerecord/test/support/adapter-helper.ts`, Rails
`vendor/rails/v8.0.2/activerecord/test/support/adapter_helper.rb:4-9`).

Left:

- `describeIfMysqlAdapter` (`test/support/describe-if-mysql-adapter.ts`, ~51
  files, re-exported by `test/cases/adapters/abstract-mysql-adapter/test-helper.ts`)
  -> `describe.runIf(currentAdapter("Mysql2Adapter"))`. ~1000 LOC alone because
  of prettier reindents; may need splitting by directory.
- `describeIfPg` (pg availability probe), `adapterSupports` / `itIfSupports` /
  `describeIfSupports` (`adapter_helper.rb:23-60`), `loadCanonicalSchema` /
  `loadAdapterSpecificSchema` (`load_schema_helper.rb:4-21`), `support/config.ts`
  constants (`config.rb:26-37`), `withSecondPool` (`connection.rb:33`).
- class (c) harness files (`run-token.ts`, `sqlite-template.ts`,
  `schema-cache-dump.ts`, `ar-db-slots.ts`, `ar-db-forks-default.ts`,
  `template-global-setup.ts`, `boot-outcome.ts`, `ddl-profile.ts`,
  `canonical-schema-stamp.ts`, `drop-all-tables.ts`), file by file.
- Drop the dead `describeIfSqlite` / `describeIfPostgresqlAdapter` arms from
  `scripts/test-compare/gates.ts` `ADAPTER_GATE_WRAPPERS`.

## Acceptance criteria

- Each name converges into the Rails helper it stands in for, callers updated.
- (c): file-level `@noRailsEquivalent PERMANENT` only for a runner fact; else converge/delete.
- `pnpm parity:api:extra --package activerecord-test-support` novel drops.
