---
title: "delete-dead-generator-migration-timestamp"
status: in-progress
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: trails#8221
claim: "2026-09-28T16:27:29Z"
assignee: "scaffold-controller-passes-locals-instead-of-setting-ivars"
blocked-by: null
closed-reason: null
---

## Context

trails#8201 moved both `MigrationGenerator`s (`packages/trailties/src/generators/migration-generator.ts`,
`packages/trailties/src/generators/rails/migration/migration-generator.ts`) onto `migrationTemplate` and
`ActiveRecord::Generators::Migration.next_migration_number`
(`vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/migration.rb:11-16`,
ported at `packages/trailties/src/generators/active-record/migration.ts`).

`migrationTimestamp()` in `packages/trailties/src/generators/base.ts` has no Rails counterpart. It was
the migration generators' hand-rolled local-clock timestamp. Since #8201 nothing calls it. It stayed in that PR
only because of the LOC ceiling.

## Acceptance criteria

- `migrationTimestamp` is deleted from `generators/base.ts`, along with any export of it.
- `pnpm build` / typecheck stay green (no remaining callers).
