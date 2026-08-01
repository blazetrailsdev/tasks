---
title: "Remove the bespoke adapter dataSources overrides and route through the converged base"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5804
claim: "2026-08-01T17:45:00Z"
assignee: "remove-bespoke-adapter-data-sources-overrides"
blocked-by: null
closed-reason: null
---

## Context

Found while converging `dataSourceExists` in PR 5787. Rails defines
`data_sources` only in
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:34`
— no concrete adapter overrides it. The base body is simply `tables | views`.

trails shadows it on all three adapters, each with a different bespoke shape:

- `sqlite3-adapter.ts` → `[...new Set([...(await this.tables()), ...(await this.views())])]`
  — a faithful reimplementation, but still a shadow the base already provides.
- `mysql2-adapter.ts` → a bespoke `SELECT table_name FROM information_schema.tables
WHERE table_schema = database() ORDER BY table_name` query. This is a real
  behavioural deviation, not just duplication: it returns tables and views in one
  catalog scan rather than `tables | views`, and it imposes an ordering Rails does
  not.
- `postgresql/schema-statements-class.ts:321` → `Promise.all([tables(), views()])`
  behind a comment claiming `SchemaCache.addAll` needs the method to exist for
  `DatabaseTasks.dumpSchemaCache`'s capability check. Verify that claim before
  deleting — if the capability check is real, the fix is to make the check see
  the inherited method, not to keep the shadow.

`include(AbstractAdapter, SchemaStatements)` already puts the base body on every
adapter's prototype chain, so these can be deleted outright rather than replaced
with delegation stubs. Note the base `dataSourceExists` falls back to
`dataSources().includes(name)` on `NotImplementedError`, so any behaviour change
here is observable through that path too.

## Acceptance criteria

- Adapter-level `dataSources` overrides are deleted; all callers reach the base
  `tables | views` body.
- The mysql2 single-scan/ordered deviation is removed, or justified at the call
  site with a Rails citation if some caller genuinely depends on it.
- The PostgreSQL `dumpSchemaCache` capability-check claim is verified; if real,
  the check is fixed rather than the shadow retained.
- Existing schema-cache and schema-statements suites pass on sqlite, pg and mysql.
