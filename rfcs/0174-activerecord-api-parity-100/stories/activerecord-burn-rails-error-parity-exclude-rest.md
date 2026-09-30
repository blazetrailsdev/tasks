---
title: "activerecord: raise Rails' error classes in the 14 rest files grandfathered by rails-error-parity"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: errors
packages: ["activerecord"]
deps: ["retire-dead-error-parity-disables-and-stale-arm-throw-marks"]
deps-rfc: []
est-loc: 420
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
activerecord files. This story takes the rest group:

- `packages/activerecord/src/database-configurations/connection-url-resolver.ts`
- `packages/activerecord/src/database-configurations/database-config.ts`
- `packages/activerecord/src/locking/pessimistic.ts`
- `packages/activerecord/src/migration/command-recorder.ts`
- `packages/activerecord/src/support/quote-regex.ts`
- `packages/activerecord/src/support/supports.ts`
- `packages/activerecord/src/support/template-global-setup.ts`
- `packages/activerecord/src/test-fixtures/with-transactional-fixtures.ts`
- `packages/activerecord/src/test-helpers/models/author.ts`
- `packages/activerecord/src/test-helpers/models/bulb.ts`
- `packages/activerecord/src/test-helpers/models/developer.ts`
- `packages/activerecord/src/test-helpers/models/person.ts`
- `packages/activerecord/src/testing/query-assertions.ts`
- `packages/activerecord/src/validations/uniqueness.ts`

`retire-dead-error-parity-disables-and-stale-arm-throw-marks` (RFC 0127) retires three dead inline disables first.

## Acceptance criteria

- [ ] Every bare `Error` / wrong-class throw in these files raises Rails' class with Rails' message, and each file is removed from `rails-error-parity-exclude.json`.
- [ ] Files under `test-helpers/` / `support/` that mirror Rails `test/` code raise what the Rails test helper raises.
- [ ] `pnpm lint` green with the files removed.
