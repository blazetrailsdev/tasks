---
title: "port-rake-dsl-task-manager-for-app-tasks"
status: draft
updated: 2026-09-25
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

`engine-never-loads-lib-tasks` cannot land on its own: trails has no Rake at all.
Rails' path from `bin/rails feeds:foo` to an app task is:

- `Rails::Command::RakeCommand` (`railties/lib/rails/commands/rake/rake_command.rb`)
  boots `Rake.application`, calls `Rails.application.load_tasks`, and invokes the
  task by name.
- `Engine#load_tasks` (`railties/lib/rails/engine.rb:468-472`) → `run_tasks_blocks(app)`;
  `Engine#run_tasks_blocks` (`engine.rb:685-688`) calls `super` then
  `paths["lib/tasks"].existent.sort.each { |ext| load(ext) }`;
  `Application#run_tasks_blocks` (`application.rb:560-569`) runs every railtie's
  blocks, loads `rails/tasks.rb` and defines `task :environment`.
- Each `lib/tasks/*.rake` file registers tasks through `Rake::DSL`
  (`namespace`, `desc`, `task`), and `rails generate task` emits exactly that
  (`railties/lib/rails/generators/rails/task/templates/task.rb.tt`).

trails has none of the Rake half: no `Rake::DSL` / `Rake::TaskManager` /
`Rake::Task`, no `loadTasks`, and the CLI (`packages/trailties/src/cli.ts`) has no
rake-command fallback. `Trailtie#runTasksBlocks` (`packages/trailties/src/trailtie.ts:129`)
has no caller. `TaskGenerator` (`packages/trailties/src/generators/rails/task/task-generator.ts`)
emits `export async function <action>()` stubs, which nothing can dispatch.

The rake gem is not vendored under `vendor/` (it is installed locally as
rake-13.2.1: `lib/rake/dsl_definition.rb`, `task_manager.rb`, `task.rb`,
`application.rb`), so a port today would have no in-repo source to mirror.

## Acceptance criteria

- rake is vendored through `vendor/sources.ts` so its `lib/rake/*.rb` can be cited.
- A minimal async port of `Rake::DSL` (`namespace`, `desc`, `task` with
  prerequisites), `Rake::TaskManager` (define/lookup/`in_namespace`) and
  `Rake::Task#invoke`, placed where `parity:api` maps rake's files.
- `Engine#loadTasks` and `Application#runTasksBlocks` (`application.rb:560-569`,
  including `task :environment`) are ported on top of it.
- Unblocks `engine-never-loads-lib-tasks`, which then adds the `Engine#runTasksBlocks`
  override, the CLI rake-command dispatch, and the generator template
  (`task.rb.tt`: `namespace`/`desc`/`task ...: :environment`).
