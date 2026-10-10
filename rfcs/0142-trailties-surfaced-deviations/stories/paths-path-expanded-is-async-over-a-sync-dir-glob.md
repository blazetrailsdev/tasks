---
title: "trailties: Paths::Path#expanded is async where Rails' is a sync Dir.glob, forcing Path#firstSync"
status: draft
updated: 2026-10-10
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Paths::Path#expanded` (`vendor/rails/v8.0.2/railties/lib/rails/paths.rb:201-217`) is
synchronous: it expands each path against `@root.path` and, for a globbed directory, concats
`files_in(path)` (`paths.rb:237-242`), which is `Dir.glob(@glob, base: path)` minus `@exclude`,
joined and sorted. `first`, `last`, `existent`, `existent_directories` and `to_a` all read it in-line
(`paths.rb:143-149,220-235`), and so do `Root#filter_by` and the four readers above it
(`paths.rb:98-123`).

trails' `Path#expanded` (`packages/trailties/src/paths.ts`) is `async` because it globs through
`@blazetrails/activesupport/glob`, so `first`, `toA`, `existent`, `existentDirectories` and
`Root#filterBy` / `autoloadOnce` / `eagerLoad` / `autoloadPaths` / `loadPaths` are all promises, the
`files_in` helper is inlined, and every caller in `engine.ts`, `application.ts`, `rails.ts`,
`application/finisher.ts` and `trailties/action-controller.ts` awaits. ruby-compat already has a
synchronous `Dir.glob` (`packages/ruby-compat/src/dir.ts`), used by `migration.ts`, `fixtures.ts` and
`source-annotation-extractor.ts`; it takes no `base:` yet.

Because `first` is async, `ActiveRecord::Tasks::DatabaseTasks.db_dir`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:83-85`), a synchronous
memoized reader, cannot call it. `Path#firstSync` was added for it (trails PR for story
`database-tasks-env-memoizes-to-s-and-db-dir-expands-by-hand`) with a
`@noRailsEquivalent CONVERGEABLE` receipt naming this story. It expands `@paths.first` against the
root and does not glob, so it disagrees with `expanded.first` for a globbed directory path.

## Acceptance criteria

- [ ] `Path#expanded` is synchronous over `Dir.glob` (with `base:` ported to ruby-compat, or the
      equivalent join), and `files_in` is extracted as a private method at its Rails name.
- [ ] `first`, `toA`, `existent`, `existentDirectories` and `Root#filterBy` with its four readers
      return values, not promises; their callers drop the `await`.
- [ ] `Path#firstSync` is deleted and `DatabaseTasks.dbDir` calls `Path#first`.
- [ ] `packages/trailties/src/paths.test.ts`, `tasks/database-tasks.test.ts` and
      `trailties/src/commands/db.test.ts` green.
