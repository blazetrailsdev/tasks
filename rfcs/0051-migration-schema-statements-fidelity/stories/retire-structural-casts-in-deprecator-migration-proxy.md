---
title: "Type deprecator.ts MigrationProxy's loaded migration as Migration instead of structural casts"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5788
claim: "2026-08-01T02:33:47Z"
assignee: "retire-structural-casts-in-deprecator-migration-proxy"
blocked-by: null
closed-reason: null
---

## Context

PR #5596 narrowed `MigrationProxy.migration()` in
`packages/activerecord/src/migration.ts` to yield a real `Migration`, matching
`MigrationProxy#load_migration`'s `name.constantize.new(name, version)`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1194-1198`). The
second, separate `MigrationProxy` class in
`packages/activerecord/src/deprecator.ts:44` was left untouched and still types
the loaded migration as `object`, casting at each delegation site:
`migrate()` casts to `{ migrate(d): Promise<void> }`, `announce()` to
`{ announce(msg): void }`, `write()` to `{ write(t): void }`, and
`disableDdlTransaction` to `{ disableDdlTransaction?: boolean }` — the same
structural-shape pattern #5596 retired on the Migrator path. Rails has one
`MigrationProxy` that delegates to a real `Migration` (`migration.rb:1187`).

Whether the two classes should converge into one is part of the question: the
deprecator copy exists because the parity:api extractor buckets
`MigrationProxy` under `deprecator.rb`.

## Acceptance criteria

- [ ] `deprecator.ts`'s `MigrationProxy` loads and delegates to a typed
      `Migration` — no `as { ... }` structural casts on the delegation sites.
- [ ] The duplication between the two `MigrationProxy` classes is resolved or
      the reason they must stay separate is recorded at the call site.
- [ ] parity:api's `MigrationProxy` bucketing is unchanged by the fix.
