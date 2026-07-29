---
title: "Migration#executionStrategy must honour ActiveRecord.migrationStrategy and memoize per migration"
status: draft
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord.migrationStrategy` (`packages/activerecord/src/ar-config.ts:64`,
defaulting to `DefaultStrategy`) is configurable but never read. Rails'
`Migration#execution_strategy` memoizes
`@execution_strategy ||= ActiveRecord.migration_strategy.new(self)`
(`vendor/rails/activerecord/lib/active_record/migration.rb`), so an app that
sets `ActiveRecord.migration_strategy` gets its strategy for every migration.

trails' `Migration#executionStrategy` (`migration.ts:1379`) hardcodes
`return new DefaultStrategy()` — it ignores the configured class, passes no
migration, and memoizes nothing, so a fresh instance is built on every read.
`ar-config.test.ts:23` only asserts the default value of the config, so the
divergence is invisible to the suite.

## Acceptance criteria

- [ ] `Migration#executionStrategy` reads `ActiveRecord.migrationStrategy`,
      constructs it with `this`, and memoizes the instance per migration.
- [ ] A test sets `ActiveRecord.migrationStrategy` to a custom subclass and
      asserts the migration uses it (this replaces the coverage lost when
      #5596 removed the trails-only Migrator-level `strategy:` option).
