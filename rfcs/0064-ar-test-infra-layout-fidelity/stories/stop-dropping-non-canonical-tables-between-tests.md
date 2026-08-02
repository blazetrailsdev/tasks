---
title: "Retire the between-test drop arm the boot-laid set exists to serve"
status: closed
updated: 2026-08-02
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "premise gone: the between-test drop arm was removed by PR #5719 (merged 2026-07-31T17:46:15Z, 'remove the global between-test reset and its skip shield'). git grep resetTestTables on origin/main shows no call in packages/activerecord/src/cases/helper.ts; the only production caller left is the deliberate boot-time purge in test-setup-dy.ts:60 on the canonical-stamp fast path, which is load-bearing for worker-DB recycling and must not delete. Residual boot-laid-fallback hardening is covered by boot-laid-fallback-silently-drops-adapter-specific-tables; the leaked-row invariant #5719 exposed is covered by guard-non-transactional-row-writing-test-files."
---

## Context

`resetTestTables` (`packages/activerecord/src/support/drop-all-tables.ts`) drops
every table outside the boot-laid set before each test. Rails does no such thing:
`LoadSchemaHelper#load_schema`
(`vendor/rails/activerecord/test/support/load_schema_helper.rb:12-15`) loads
`schema.rb` plus the adapter-specific schema file, and row state is undone by
transactional fixtures — nothing is dropped between tests.

The drop arm exists for two reasons, both trails-only:

- tests still create bespoke tables (the `defineSchema` leftovers RFC 0059 is
  burning down), so their shape must not leak into the next file;
- migrator tests manage `schema_migrations` / `ar_internal_metadata` per-test and
  rely on the reset clearing them.

PR #5659 removed the hand-maintained `ADAPTER_SPECIFIC_TABLES` map by snapshotting
the boot-laid set from the database, but the whole boot-laid concept — the
snapshot, the boot purge in `test-setup-dy.ts`, `bootLaidTableNames`, and the
`CANONICAL_TABLE_NAMES` fallback — exists only to answer "what may I drop?".
Remove the need to ask and all of it deletes.

Prior campaigns are closed: RFC 0049 (superseded by 0060) and 0060 both landed
the truncate-instead-of-drop optimization but kept the drop arm for the two
reasons above.

## Acceptance criteria

- Establish what still requires the between-test drop: enumerate the tests that
  create non-canonical tables and the migrator tests that depend on the
  bookkeeping tables being cleared.
- Either land the reset with no drop arm, or (if the burndown is incomplete)
  reduce the drop arm to the enumerated set and record the blocking stories so
  the last step is mechanical.
- If the drop arm goes, `recordBootLaidTables`, `bootLaidTableNames`, the boot
  purge in `test-setup-dy.ts`, and `CANONICAL_TABLE_NAMES` all delete with it.
