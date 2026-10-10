---
title: "activerecord: DatabaseTasks#env memoizes Rails.env.to_s"
status: in-progress
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8754
claim: "2026-10-10T12:39:39Z"
assignee: "database-tasks-env-memoizes-to-s-and-db-dir-expands-by-hand"
blocked-by: null
closed-reason: null
---

## Context

Left over from trails#8721, narrowed by trails#8740, which landed the `db_dir` half (it reads
`Paths::Path#firstSync`; making `Path#first` itself synchronous is
`paths-path-expanded-is-async-over-a-sync-dir-glob`).

Rails' body is a bare one-liner
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:99-105`):

```ruby
def env = @env ||= Rails.env
```

The port (`packages/activerecord/src/tasks/database-tasks.ts`) is
`this._env ??= TopLevel.Trails!.env.toString()` and carries
`@inventedArm toString — CONVERGEABLE` against this story. Rails memoizes `Rails.env` itself, an
`ActiveSupport::EnvironmentInquirer` (`railties/lib/rails.rb:75-77`), with no `to_s`.

trails#8740 tried the direct change. Typing `env` as `string | EnvironmentInquirer` failed typecheck
at every reader that compares it (`env === "test"`), uses it as a computed key
(`{ [DatabaseTasks.env]: ... }`) or passes it as `envName: string`, across
`tasks/database-tasks.test.ts`, `connection-handling.test.ts`, `migration/pending-migrations.test.ts`
and the `database-tasks-*.trails.test.ts` files. `EnvironmentInquirer` is an object in trails, where
Ruby's is a `String` subclass that compares and hashes as its content.

## Acceptance criteria

- [ ] `DatabaseTasks.env` memoizes `TopLevel.Trails!.env` with no `toString()`, and its readers compare
      and key through the inquirer (`rbEqual` / `toString` at the reader that needs a primitive), or
      the repo owner rules the call permanent against CLAUDE.md § "Ruby Strings are JS string
      primitives" and the receipt reads `PERMANENT`.
- [ ] The `@inventedArm toString — CONVERGEABLE` receipt naming this story is gone.
- [ ] `tasks/database-tasks.test.ts` and `trailties/src/commands/db.test.ts` green.
