---
title: "converge-migrationcontext-migrate-dispatch-onto-up-down"
status: done
updated: 2026-07-31
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5745
claim: "2026-07-31T19:43:09Z"
assignee: "converge-migrationcontext-migrate-dispatch-onto-up-down"
blocked-by: null
closed-reason: null
---

## Context

`MigrationContext#migrate` (`vendor/rails/activerecord/lib/active_record/migration.rb:1233-1244`)
dispatches to `up` / `down`, which each build a per-run `Migrator`:

```ruby
def migrate(target_version = nil, &block)
  case
  when target_version.nil?                          then up(target_version, &block)
  when current_version == 0 && target_version == 0  then []
  when current_version > target_version             then down(target_version, &block)
  else                                                   up(target_version, &block)
  end
end
```

trails' `Migrator#migrate`
(`packages/activerecord/src/migration.ts`, the `async migrate(targetVersion, filter)`
method) instead inlines the dispatch and calls `_migrateUp` / `_migrateDown`
directly, comparing `target` against `currentVersion()`:

- `target > current` → `_migrateUp`
- `target < current` → `_migrateDown`
- `target === current` → **nothing runs**

Rails' `else` arm sends `target == current` to `up(target)`, whose `runnable`
is `migrations[start..finish].reject { ran? }` — so an _unapplied_ migration
whose version is below an already-applied `target` still runs. trails skips it.
Repro: versions `1` and `2` exist, only `2` is applied, `migrate(2)` runs
migration `1` in Rails and is a no-op in trails.

PR #5484 converged `run` / `up` / `down` onto the per-run Migrator
(`_forRun`) but deliberately left `migrate` alone: it carries a `filter`
callback that `up` / `down` do not, and Rails threads the equivalent as a
`&block` into `up`/`down`. Ruby block params are not counted by api-compare's
arity check, so adding a `filter` parameter to `up`/`down` would _create_ an
arity mismatch against `MigrationContext#up` / `#down` — the block has to be
modelled some other way (e.g. as the per-run Migrator's construction-time
migration list, which is what Rails actually does: `migrations.select(&block)`
is passed to `Migrator.new`).

## Acceptance criteria

- `Migrator#migrate` dispatches to `up` / `down` rather than reaching into
  `_migrateUp` / `_migrateDown`, matching Rails' four-arm `case`, including
  the `current_version == 0 && target_version == 0 → []` arm and the
  `target == current → up` arm.
- The `filter` callback is applied by selecting the migration list handed to
  the per-run Migrator (Rails' `migrations.select(&block)`), not by adding a
  parameter to `up` / `down` — `parity:api` must report no new arity
  mismatch for `migration.rb`.
- A regression test covers the `target == current` case (unapplied lower
  version runs); it must fail on the pre-change baseline.
