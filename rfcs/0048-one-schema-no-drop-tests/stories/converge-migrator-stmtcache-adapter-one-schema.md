---
title: "Converge migrator/statement-cache/adapter to ride one-schema"
status: blocked
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: "rails-deviation"
deps: []
deps-rfc: []
est-loc: 350
priority: 2
pr: null
claim: "2026-06-30T11:46:26Z"
assignee: "converge-migrator-stmtcache-adapter-one-schema"
blocked-by: "Blocked on the one-schema infra spike PR #4246 (branch existing-db-schema-rc-9807c5), which is still OPEN/unmerged. None of the prerequisites exist in origin/main: no AR_ONE_SCHEMA flag, no no-op defineSchema path, no OneSchemaViolation matcher, and no eslint/one-schema-exclude.json to remove files from. Cannot rename/verify scratch tables under AR_ONE_SCHEMA=1 nor satisfy the 'remove from exclude list' acceptance criterion until #4246 merges. Unblock once #4246 lands in main."
---

## Context

These are Rails-style `create_table`/`drop_table` tests parked in
`eslint/one-schema-exclude.json`. They fail under `AR_ONE_SCHEMA=1` only because
the trails ports reuse CANONICAL table names as scratch tables (e.g.
`invertible-migration.test.ts` drops `items`; `schema-introspection.test.ts`
touches `users`), so they drop a canonical table mid-file and later tests see
"no such table". Rails scratches on non-schema.rb names so this never happens.
migrator also needs schema_migrations isolated so versions don't leak; statement-cache/adapter use defineSchema setup to port to direct DDL.

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

- `packages/activerecord/src/migrator.test.ts`
- `packages/activerecord/src/statement-cache.test.ts`
- `packages/activerecord/src/adapter.test.ts`
