---
title: "Converge MySQL/MariaDB adapter DDL tests to ride one-schema"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: "rails-deviation"
deps: []
deps-rfc: []
est-loc: 450
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

These are Rails-style `create_table`/`drop_table` tests parked in
`eslint/one-schema-exclude.json`. They fail under `AR_ONE_SCHEMA=1` only because
the trails ports reuse CANONICAL table names as scratch tables (e.g.
`invertible-migration.test.ts` drops `items`; `schema-introspection.test.ts`
touches `users`), so they drop a canonical table mid-file and later tests see
"no such table". Rails scratches on non-schema.rb names so this never happens.
Runs on the maria/mysql lane only.

Independent of RFC 0019 (these create their own scratch tables — no canonical
column convergence needed).

## Convention

Test scratch tables MUST use names NOT in the canonical `TEST_SCHEMA` (mirror
Rails' `horses`/`testings`). A test must never create/alter/drop a canonical
table: the one-schema per-test reset truncates but never restores shape, and
`repairWorkerSchema` only restores it for the NEXT file. Direct
`createTable`/`dropTable` do not trip the one-schema guard (only `defineSchema`
does), so these convert by renaming scratch tables off canonical names and
replacing any bespoke `defineSchema` setup with direct DDL.

## Acceptance criteria

- Rename scratch tables to non-canonical names (Rails-faithful); replace bespoke
  `defineSchema` setup with direct `createTable`/`dropTable`.
- Each file creates AND drops its own scratch tables, never touching a canonical
  table; passes under `AR_ONE_SCHEMA=1` on all backends it runs on.
- Remove each from `eslint/one-schema-exclude.json` as it lands.

### Files

- `packages/activerecord/src/adapters/mysql2/mysql2-adapter.test.ts`
- `packages/activerecord/src/connection-adapters/mysql2-adapter.test.ts`
- `packages/activerecord/src/adapters/abstract-mysql-adapter/schema.test.ts`
- `packages/activerecord/src/adapters/abstract-mysql-adapter/schema-migrations.test.ts`
- `packages/activerecord/src/adapters/abstract-mysql-adapter/adapter-prevent-writes.test.ts`
