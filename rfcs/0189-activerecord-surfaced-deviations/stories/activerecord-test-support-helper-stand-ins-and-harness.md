---
title: "activerecord-test-support-helper-stand-ins-and-harness"
status: draft
updated: 2026-10-27
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

Remainder of `activerecord-test-support-extra-surface-burndown-remainder`
(RFC 0120), whose class (b) `slotDatabaseName` was deleted in the PR that
closes it. The per-name triage with `vendor/rails` citations is in
`docs/infrastructure/activerecord-test-support-population-audit.md`.

- **(a)** about 30 Rails test-helper stand-ins under trails names:
  `describeIfPg` / `describeIfSqlite` / `describeIfMysqlAdapter` /
  `describeIfPostgresqlAdapter` for `current_adapter?`
  (`vendor/rails/v8.0.2/activerecord/test/support/adapter_helper.rb:4-9`);
  `adapterSupports` / `itIfSupports` / `describeIfSupports`
  (`adapter_helper.rb:23-60`); `loadCanonicalSchema` for `load_schema` and
  `loadAdapterSpecificSchema`, which Rails inlines
  (`load_schema_helper.rb:4-21`); the `support/config.ts` constants from
  `ARTest.expand_config` (`config.rb:26-37`, `connection.rb:10-11`);
  `withSecondPool` for `establish_connection :arunit2` (`connection.rb:33`).
- **(c)** the parallel-vitest harness files (`run-token.ts`,
  `sqlite-template.ts`, `schema-cache-dump.ts`, `ar-db-slots.ts`,
  `ar-db-forks-default.ts`, `template-global-setup.ts`, `boot-outcome.ts`,
  `ddl-profile.ts`, `canonical-schema-stamp.ts`, `drop-all-tables.ts`),
  decided file by file. `run-token.ts`'s `runDatabasePrefix` now carries the
  slot naming `slotDatabaseName` did.

## Acceptance criteria

- (a) converges into the Rails helper each name stands in for, under the
  Rails name in the file mirroring that `.rb`; callers updated.
- (c): a file-level `@noRailsEquivalent PERMANENT` only where the receipt
  states a runner fact (parallel forks); everything else converges or is
  deleted.
- Split across PRs by class; `pnpm parity:api:extra --package
activerecord-test-support` novel drops accordingly.
