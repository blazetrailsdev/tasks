---
title: "activerecord: DatabaseTasks#env memoizes Rails.env.to_s and #db_dir expands Path#first by hand"
status: ready
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
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

Left over from trails#8721, which removed the standalone fallback arms from `DatabaseTasks`' three
memoized readers. Rails' bodies are bare one-liners
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:83-85,99-105`):

```ruby
def db_dir = @db_dir ||= Rails.application.config.paths["db"].first
def env    = @env ||= Rails.env
```

Two calls in the ports (`packages/activerecord/src/tasks/database-tasks.ts`) are still not Rails':

- `env` is `this._env ??= TopLevel.Trails!.env.toString()`. Rails memoizes `Rails.env` itself, an
  `ActiveSupport::EnvironmentInquirer` (`railties/lib/rails.rb:75-77`), with no `to_s`.
- `dbDir` is `File.expandPath(first(TopLevel.Trails!.application!.config.paths().get("db")!.toAry())!, TopLevel.Trails!.application!.config.root!)`.
  Rails calls `Paths::Path#first`, which is `expanded.first` (`railties/lib/rails/paths.rb:143-145`).
  trails' `Path#first` (`packages/trailties/src/paths.ts`) is async because `expanded` globs through
  the async fs adapter, so the sync getter re-derives the expansion by hand and reads `root` itself.

Neither is visible to the call gates: both are calls the TS body adds.

## Acceptance criteria

- [ ] `DatabaseTasks.env` memoizes `TopLevel.Trails!.env` with no `toString()`, or the added call
      carries an `@inventedArm toString` receipt with its permanence token.
- [ ] `DatabaseTasks.dbDir` reads the db path through `Paths::Path#first` (or a sync peek of it that
      `paths.ts` owns), with no `File.expandPath` and no `config.root` read in `database-tasks.ts`.
- [ ] `tasks/database-tasks.test.ts` and `trailties/src/commands/db.test.ts` green.
