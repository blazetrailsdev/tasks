---
title: "activerecord: raise Rails' error classes in the 20 root files grandfathered by rails-error-parity"
status: done
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: errors
packages: ["activerecord"]
deps: ["retire-dead-error-parity-disables-and-stale-arm-throw-marks"]
deps-rfc: []
est-loc: 600
priority: null
pr: trails#8602
claim: "2026-10-06T22:03:09Z"
assignee: "activerecord-burn-rails-error-parity-exclude-root"
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/rails-error-parity` requires Rails-mirroring source to raise the ported error class Rails
raises (same class, same message, same site — CLAUDE.md § "Errors"). Pre-existing violators are
grandfathered in `eslint/rails-error-parity-exclude.json`, which is only-shrink; it holds **74**
activerecord files. This story takes the root group:

- `packages/activerecord/src/aggregations.ts`
- `packages/activerecord/src/associations.ts`
- `packages/activerecord/src/attribute-methods.ts`
- `packages/activerecord/src/connection-handling.ts`
- `packages/activerecord/src/database-configurations.ts`
- `packages/activerecord/src/delegated-type.ts`
- `packages/activerecord/src/enum.ts`
- `packages/activerecord/src/fixtures.ts`
- `packages/activerecord/src/insert-all.ts`
- `packages/activerecord/src/migration.ts`
- `packages/activerecord/src/nested-attributes.ts`
- `packages/activerecord/src/persistence.ts`
- `packages/activerecord/src/querying.ts`
- `packages/activerecord/src/reflection.ts`
- `packages/activerecord/src/result.ts`
- `packages/activerecord/src/schema-dumper.ts`
- `packages/activerecord/src/signed-id.ts`
- `packages/activerecord/src/test-fixtures.ts`
- `packages/activerecord/src/test-setup-dy.ts`
- `packages/activerecord/src/test-setup-worker-db.ts`

`retire-dead-error-parity-disables-and-stale-arm-throw-marks` (RFC 0127) retires three dead inline disables first.

## Acceptance criteria

- [ ] Every bare `Error` / wrong-class throw in these files raises Rails' class with Rails' message, and each file is removed from `rails-error-parity-exclude.json`.
- [ ] Files under `test-helpers/` / `support/` that mirror Rails `test/` code raise what the Rails test helper raises.
- [ ] `pnpm lint` green with the files removed.

## Verification

```bash
pnpm lint
```
