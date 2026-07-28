---
title: "ADAPTER_SPECIFIC_TABLES duplicates the loaders and is guarded exactly only on sqlite"
status: draft
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`support/load-schema-helper.ts` carries `ADAPTER_SPECIFIC_TABLES`, a
hand-written map of the table names each `ADAPTER_SPECIFIC_SCHEMAS` arm creates
(added by PR #5523). `support/drop-all-tables.ts` reads it: the between-test
`reset` mode drops every table outside the boot-laid set, so a table created by
a loader but missing from the map is dropped before the first test of every
file.

The list is a duplicate of what the loaders already express, kept in step by
hand. `support/load-schema-helper.trails.test.ts` guards it, but unevenly:

- the sqlite arm gets an **exact** set match (run the arm on a `:memory:` DB,
  compare the created tables to the declared list);
- postgres and mysql get only an **existence** check against the live lane, so
  "loader creates a table the map does not declare" is invisible on those lanes
  — exactly the direction that silently breaks.

The asymmetry exists because the sqlite arm can be exercised on a throwaway
`:memory:` database and the PG/MySQL arms cannot without provisioning a scratch
DB.

## Acceptance criteria

- Either derive the name set from the loaders (so no second list exists), or
  make the guard exact on every lane — e.g. run the active adapter's arm against
  a scratch database/schema and diff the created tables against the declaration.
- The guard fails when a table is added to a loader and not to the map, on
  whichever lane CI is running.
- If the map stays, `port-postgresql-specific-schema-remainder` and
  `port-mysql2-specific-schema-remainder` each add many tables to it; sequencing
  this before them avoids doing the bookkeeping twice.
