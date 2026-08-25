---
title: "Stamp the sqlite and MySQL templates so their workers take the boot fast path"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5706
claim: "2026-07-31T02:45:05Z"
assignee: "stamp-sqlite-and-mysql-templates-for-the-boot-fast-path"
blocked-by: null
closed-reason: null
---

## Context

PR #5678 replaced the per-worker boot's schema-file SHA1 with a run-token stamp
(`packages/activerecord/src/support/canonical-schema-stamp.ts`) and taught
`test-setup-dy.ts` to take a TRUNCATE fast path — skipping the canonical DDL —
when the database it claimed already carries this run's stamp.

Only the PostgreSQL lane stamps: `template-global-setup.ts`'s `pgAdapter.provision`
calls `stampCanonicalSchema(adapter, runToken)` after building the template, and
every slot DB is a `CREATE DATABASE ... TEMPLATE` clone of it. The sqlite and
MySQL lanes both build their databases from the same `loadSchema` call
(`buildTemplateSchema`, template-global-setup.ts:63-71) but never stamp:

- sqlite: globalSetup builds one template file, `ensureWorkerClone`
  (`support/sqlite-template.ts`) copies it per worker.
- MySQL: globalSetup runs `loadSchema` directly against each slot DB
  (`mysqlAdapter.provision`, no `CREATE DATABASE ... TEMPLATE` primitive).

So on those two lanes every worker boot purges the database globalSetup just
laid and re-lays the whole canonical registry — the DDL the template build was
meant to buy once per run. Stamping in `buildTemplateSchema` (or at each lane's
provision site) would put both on the same fast path PG already takes.

## Acceptance criteria

- The sqlite template file and each MySQL slot DB carry the canonical-schema
  stamp when globalSetup finishes.
- A worker booting onto either takes `test-setup-dy.ts`'s fast path (truncate +
  `resetTestTables` + `loadAdapterSpecificSchema`), not the purge+full-load path.
- Worker recycling stays correct on both lanes: a worker landing on a database
  an earlier worker's tests ran against must still end up with the full
  canonical + adapter-specific schema (this is what #5678's first CI run got
  wrong — see the boot assertion in `test-setup-dy.ts`).
- Measure and report the per-lane wall-clock change; if a lane gets slower
  (sqlite's clone is already cheap and TRUNCATE is not free), leave that lane
  unstamped and say why.
