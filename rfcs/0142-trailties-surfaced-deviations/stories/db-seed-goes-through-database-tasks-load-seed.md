---
title: "db-seed-goes-through-database-tasks-load-seed"
status: draft
updated: 2026-10-11
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

`trails db seed` loads the seed file itself. `runSeed` in
`packages/trailties/src/commands/db.ts` probes `db/seeds.ts` / `db/seeds.js`
under the cwd, prints `Running seeds...` / `Seeds completed.` and `import()`s
the file with a cache-busting `_t` query. `db prepare` installs an ad-hoc
`DatabaseTasks.seedLoader` object literal around the same `runSeed`.

Rails never loads the file from the task. `db:seed`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/railties/databases.rake`)
is `DatabaseTasks.load_seed`, which
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb`,
`load_seed`) calls `seed_loader.load_seed` and raises when no loader is set.
The loader is the application: ActiveRecord's railtie assigns
`DatabaseTasks.seed_loader = Rails.application`, and `Engine#load_seed`
(`vendor/rails/v8.0.2/railties/lib/rails/engine.rb`) resolves
`paths["db/seeds.rb"].existent.first` and loads it inside
`run_callbacks(:load_seed)`.

trails has both halves ported and unused by the command:
`DatabaseTasks.loadSeed` (`packages/activerecord/src/tasks/database-tasks.ts`)
and `Engine#loadSeed` (`packages/trailties/src/engine.ts`). Nothing assigns
`DatabaseTasks.seedLoader` to the application.

Left out of trails#8768 (which made `db seed` boot the application and load the
file once) because that PR's test applications boot through an engine path that
defines no `Trails.application`, so there is no loader to hand to yet.

## Acceptance criteria

- [ ] Booting an application assigns `DatabaseTasks.seedLoader` to it, where
      Rails' ActiveRecord railtie does.
- [ ] `trails db seed`, `db setup`, `db reset` and `db prepare` reach the seed
      file through `DatabaseTasks.loadSeed()` only; `runSeed`'s own file probe,
      `import()` and the `prepare` object-literal loader are deleted.
- [ ] The `load_seed` callbacks run around the load, pinned by a test.
- [ ] `db seed` with no seed loader raises as `DatabaseTasks.load_seed` does.
