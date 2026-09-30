---
title: "activerecord: raise Rails' error classes in the 20 associations-relation-encryption-tasks files grandfathered by rails-error-parity"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: errors
packages: ["activerecord"]
deps: ["retire-dead-error-parity-disables-and-stale-arm-throw-marks"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/rails-error-parity` requires Rails-mirroring source to raise the ported error class Rails
raises (same class, same message, same site — CLAUDE.md § "Errors"). Pre-existing violators are
grandfathered in `eslint/rails-error-parity-exclude.json`, which is only-shrink; it holds **74**
activerecord files. This story takes the associations-relation-encryption-tasks group:

- `packages/activerecord/src/associations/association.ts`
- `packages/activerecord/src/associations/builder/association.ts`
- `packages/activerecord/src/associations/collection-association.ts`
- `packages/activerecord/src/associations/disable-joins-association-scope.ts`
- `packages/activerecord/src/associations/instance-methods.ts`
- `packages/activerecord/src/associations/preloader/branch.ts`
- `packages/activerecord/src/encryption/extended-deterministic-queries.ts`
- `packages/activerecord/src/encryption/extended-deterministic-uniqueness-validator.ts`
- `packages/activerecord/src/encryption/message-pack-message-serializer.ts`
- `packages/activerecord/src/encryption/message-serializer.ts`
- `packages/activerecord/src/encryption/test-helpers.ts`
- `packages/activerecord/src/relation/finder-methods.ts`
- `packages/activerecord/src/relation/predicate-builder.ts`
- `packages/activerecord/src/relation/predicate-builder/association-query-value.ts`
- `packages/activerecord/src/relation/query-methods.ts`
- `packages/activerecord/src/relation/thenable.ts`
- `packages/activerecord/src/tasks/database-tasks.ts`
- `packages/activerecord/src/tasks/mysql-database-tasks.ts`
- `packages/activerecord/src/tasks/postgresql-database-tasks.ts`
- `packages/activerecord/src/tasks/sqlite-database-tasks.ts`

`retire-dead-error-parity-disables-and-stale-arm-throw-marks` (RFC 0127) retires three dead inline disables first.

## Acceptance criteria

- [ ] Every bare `Error` / wrong-class throw in these files raises Rails' class with Rails' message, and each file is removed from `rails-error-parity-exclude.json`.
- [ ] Files under `test-helpers/` / `support/` that mirror Rails `test/` code raise what the Rails test helper raises.
- [ ] `pnpm lint` green with the files removed.
