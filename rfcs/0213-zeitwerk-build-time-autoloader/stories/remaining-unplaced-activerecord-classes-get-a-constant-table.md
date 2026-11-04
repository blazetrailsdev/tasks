---
title: "Remaining unplaced activerecord classes (TestDatabases, SQLCounter) get a constant table"
status: done
updated: 2026-11-04
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9707
claim: "2026-11-04T12:08:16Z"
assignee: "rack-builder-script-resolves-toplevel-constants"
blocked-by: null
closed-reason: null
---

## Context

trails#9702 seated the fixtures and autoloaded encryption classes. The old `excluded` list (trails `bcb75d2022`, `constant-residue.json`) still names activerecord lib files outside every entry graph that hold Rails classes but no constant table:

- `packages/activerecord/src/test-databases.ts::TestDatabases`: `ActiveRecord::TestDatabases` (`vendor/rails/v8.0.2/activerecord/lib/active_record/test_databases.rb:6`)
- `packages/activerecord/src/testing/query-assertions.ts::SQLCounter`: `ActiveRecord::Assertions::QueryAssertions::SQLCounter` (`vendor/rails/v8.0.2/activerecord/lib/active_record/testing/query_assertions.rb:91`)
- `relation/predicate-builder/deferred-distinct-pk-in.ts::{DeferredIdsIn,DeferredIdsNotIn,DeferredPluck}`: check whether they have Rails rows; if they don't, they are trails-only.

Same mechanism as #9702: a `SUBPATH_ENTRIES` / `LAZY_DIRS` entry in `scripts/api-compare/class-paths.ts`, with the file importing its generated table.

## Acceptance criteria

- `rbModName` answers each one's Ruby path.
- `pnpm parity:class-paths:check` stays green.
