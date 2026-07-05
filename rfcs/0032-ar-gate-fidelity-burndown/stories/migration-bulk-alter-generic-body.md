---
title: "Converge bulk_alter migration tests to generic adapter bodies"
status: draft
updated: 2026-07-05
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `gate-wrong-gate-body-convergence` (RFC 0032). Three
`BulkAlterTableMigrationsTest` cases in
`packages/activerecord/src/migration.test.ts` (the `describeIfPg` block around
line 2996) remain `wrong-gate`:

- "changing columns" — rails `features=[bulk_alter]` / ts `adapters=[postgresql]`
- "changing column null with default" — same
- "default functions on columns" — rails `features=[bulk_alter,text_column_with_default]` / ts `adapters=[postgresql]`

The bodies hardcode `new PostgreSQLAdapter(PG_TEST_URL)` and raw PG DDL
(`serial primary key`, `gen_random_uuid()`). `bulk_alter` runs on pg+mysql, so
"changing columns"/"changing column null with default" must be rewritten to use
the current test connection generically and run on the mysql lane too.
"default functions on columns" gates `bulk_alter,text_column_with_default`
(runtime intersection = pg-only), so it can stay pg-bodied but must move to a
feature-only gate (`itIfSupports("bulk_alter,text_column_with_default")`) and use
the pooled connection rather than a hardcoded PG adapter URL.

Rails: vendor/rails/activerecord/test/cases/migration/change_table_test.rb /
bulk_alter coverage in migration tests.

## Acceptance criteria

- [ ] Rewrite the three bodies to use the current test connection (no hardcoded
      adapter URL) with adapter-generic schema statements where they must run on
      mysql.
- [ ] Gate each so `adapterFeatureKey(ts)` equals `railsGate`:
      `*|bulk_alter` for the first two, `*|bulk_alter,text_column_with_default`
      for the third.
- [ ] `test:compare --package activerecord --gates` reports no wrong-gate for
      these three tests; verify on pg + mysql lanes.
- [ ] Test names unchanged.
