---
title: "migration-next-migration-number-ignores-time-now"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8073
claim: "2026-09-25T00:44:14Z"
assignee: "datetime-attribute-rejects-ruby-datetime-values"
blocked-by: null
closed-reason: null
---

## Context

`Migration.nextMigrationNumber` (`packages/activerecord/src/migration.ts:1002-1017`) stamps
migrations from `Temporal.Now.instant()`. Rails' `next_migration_number`
(`vendor/rails/activerecord/lib/active_record/migration.rb`, `[Time.now.utc.strftime("%Y%m%d%H%M%S"), "%.14d" % number].max`)
reads `Time.now`, which `travel_to` stubs. `travelTo` in `activesupport/src/testing/time-helpers.ts`
stubs the date package's `Time.now`, so under `travelTo` the copied migration keeps the real clock.

Five tests in `packages/activerecord/src/migration.test.ts` (`CopyMigrationsTest`) are parked `it.skip` for this:
copying migrations with timestamps, ... from 2 sources, ... to destination with timestamps in future,
copying migrations to non existing directory, copying migrations to empty directory. Rails:
`vendor/rails/activerecord/test/cases/migration_test.rb` `CopyMigrationsTest`.

## Acceptance criteria

- `nextMigrationNumber` reads `Time.now` like Rails so `travelTo` is honoured.
- The five parked tests are un-skipped and green.
