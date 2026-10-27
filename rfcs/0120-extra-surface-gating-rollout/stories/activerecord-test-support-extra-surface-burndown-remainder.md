---
title: "activerecord-test-support-extra-surface-burndown-remainder"
status: done
updated: 2026-10-27
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9385
claim: "2026-10-27T20:06:22Z"
assignee: "activerecord-test-support-extra-surface-burndown-remainder"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `activerecord-test-support-extra-surface-burndown` (RFC 0120). That
story's class (b) `quoteMysqlDatabaseName` was converged onto the MySQL and
PostgreSQL adapters' `quoteTableName`, which is what Rails' `create_database` /
`drop_database` quote with
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:278-293`,
`postgresql/schema_statements.rb:54`), and `support/quote-database-name.ts` was
deleted. `pnpm parity:api:extra --package activerecord-test-support` reported 110
novel names on 2026-10-20 before that change; the triage, with a `vendor/rails`
citation per name, is in
`docs/infrastructure/activerecord-test-support-population-audit.md`.

Left:

- **(a)** about 30 Rails test-helper stand-ins under trails names:
  `describeIfPg` / `describeIfSqlite` / `describeIfMysqlAdapter` /
  `describeIfPostgresqlAdapter` for `current_adapter?`
  (`activerecord/test/support/adapter_helper.rb:4-9`); `adapterSupports` /
  `itIfSupports` / `describeIfSupports` (`adapter_helper.rb:23-60`);
  `loadCanonicalSchema` for `load_schema` and `loadAdapterSpecificSchema`, which
  Rails inlines (`load_schema_helper.rb:4-21`); the `config.ts` constants from
  `ARTest.expand_config` (`config.rb:26-37`, `connection.rb:10-11`);
  `withSecondPool` for `establish_connection :arunit2` (`connection.rb:33`).
- **(b)** `slotDatabaseName` (`support/run-token.ts:29`) versus
  `TestDatabases.create_and_load_schema`'s `"#{db_config.database}-#{i}"`
  (`activerecord/lib/active_record/test_databases.rb:11-15`).
- **(c)** the parallel-vitest harness files (`run-token.ts`,
  `sqlite-template.ts`, `schema-cache-dump.ts`, `ar-db-slots.ts`,
  `ar-db-forks-default.ts`, `template-global-setup.ts`, `boot-outcome.ts`,
  `ddl-profile.ts`, `canonical-schema-stamp.ts`, `drop-all-tables.ts`), decided
  file by file.

## Acceptance criteria

- (a) converges into the Rails helper each name stands in for, under the Rails
  name in the file mirroring that `.rb`; callers updated.
- (b) converges onto `TestDatabases` or is deleted.
- (c): a file-level `@noRailsEquivalent PERMANENT` only where the receipt states
  a runner fact (parallel forks); everything else converges or is deleted.
- Split across PRs by class; `pnpm parity:api:extra --package activerecord-test-support` novel drops accordingly.
