---
title: "activerecord-test-support-extra-surface-burndown"
status: draft
updated: 2026-10-20
rfc: "0120-extra-surface-gating-rollout"
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

`scope-activerecord-test-support-population` (RFC 0120) found that the
measurement is correct. The pseudo-package already maps onto
`activerecord/test/support` (`vendor/sources.ts`), so its 110 novel names
(2026-10-19) are real extra surface, not a mapping artifact. 104 of them are in
31 `src/support/*.ts` files that no `.rb` maps onto. The full triage, with an
18-name sample and a `vendor/rails` citation for each, is in
`docs/infrastructure/activerecord-test-support-population-audit.md` in trails.

Three classes:

- **(a) Rails test-helper behaviour under a trails name, about 30:**
  `describeIfPg` / `describeIfSqlite` / `describeIfMysqlAdapter` for
  `current_adapter?` (`test/support/adapter_helper.rb:4-9`); `adapterSupports`
  / `itIfSupports` / `describeIfSupports` for the `supports_*?` predicates
  (`adapter_helper.rb:23-60`); `loadCanonicalSchema` for `load_schema`
  (`load_schema_helper.rb:4-21`); `loadAdapterSpecificSchema`, which Rails
  inlines (`load_schema_helper.rb:9-16`); the `config.ts` constants from
  `ARTest.expand_config` (`config.rb:26-37`) and `connection.rb:10-11`; and
  `withSecondPool` for `establish_connection :arunit2` (`connection.rb:33`).
- **(b) lib behaviour in the wrong place, 2-3:** `slotDatabaseName` versus
  `TestDatabases.create_and_load_schema` (`lib/active_record/test_databases.rb:11-15`),
  and `quoteMysqlDatabaseName` versus the MySQL adapter's quoting.
- **(c) trails' parallel-vitest database harness, about 55:** `run-token.ts`,
  `sqlite-template.ts`, `schema-cache-dump.ts`, `ar-db-slots.ts`,
  `ar-db-forks-default.ts`, `template-global-setup.ts`, `boot-outcome.ts`,
  `ddl-profile.ts`, `canonical-schema-stamp.ts`, `drop-all-tables.ts`. Rails has
  no counterpart: it runs one database per `rake test:<adapter>` process.

## Acceptance criteria

- (a) converges: each name goes into the Rails helper it stands in for, under
  the Rails name in the file mirroring that `.rb`. For example, describe-level
  adapter guards become `isCurrentAdapter` calls, and `loadAdapterSpecificSchema`
  is inlined into `loadSchema`. Callers are updated.
- (b) converges onto the `activerecord` lib method it duplicates, or is deleted.
- (c) is decided file by file. A harness file Rails has no analogue for takes a
  file-level `@noRailsEquivalent PERMANENT` only where the receipt states a
  runner fact (parallel forks). Everything else converges or is deleted.
- `pnpm parity:api:extra --package activerecord-test-support` novel count drops
  accordingly. Split across PRs by class.
