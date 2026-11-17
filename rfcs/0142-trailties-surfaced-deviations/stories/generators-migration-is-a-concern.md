---
title: "generators-migration-is-a-concern"
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::Migration` (`vendor/rails/v8.0.2/railties/lib/rails/generators/migration.rb:8-9`) is `extend ActiveSupport::Concern` with a `ClassMethods` module, so including it (directly or through `ActiveRecord::Generators::Migration`, `activerecord/lib/rails/generators/active_record/migration.rb:7-9`) extends the includer with its `ClassMethods` via `Concern#append_features`.

In trails, `packages/trailties/lib/generators/migration.ts` exports `Migration` and `ClassMethods` as two plain objects, and `packages/trailties/lib/generators/active-record.ts` hand-rolls `extend(Base, Generators.ClassMethods)` and `extend(Base, ClassMethods)`. `ActiveRecord::Generators::Migration` records its include of `Generators.Migration` (trails#10221), but the ClassMethods half still does not travel with the include.

## Acceptance criteria

- `Rails::Generators::Migration` and `ActiveRecord::Generators::Migration` are `ActiveSupport::Concern`s whose `ClassMethods` reach the includer through `include()`.
- The explicit `extend(Base, …ClassMethods)` calls in `active-record.ts` (and any other includer of `Generators.Migration`) are removed.
