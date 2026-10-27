---
title: "Application forwards the block DSL and runs railties' console, runner and generators blocks"
status: draft
updated: 2026-10-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Application forwards the block DSL and runs railties' console, runner and generators blocks

## Context

trails#9375 ported `Rails::Application#server` and `#run_server_blocks`. The
rest of the same Rails surface is still missing from
`packages/trailties/src/application.ts`:

- Instance forwarders, each `self.class.<name>(&blk)`
  (`railties/lib/rails/application.rb`): `rake_tasks` (352-354),
  `initializer` (359-361), `runner` (365-367), `console` (371-373),
  `generators` (377-379).
- Overrides that run every railtie's blocks before the application's own,
  `railties.each { |r| r.run_<kind>_blocks(app) }; super`:
  `run_generators_blocks` (571-574), `run_runner_blocks` (576-579),
  `run_console_blocks` (581-584).

Without the overrides, `Trails.application.loadConsole` / `loadRunner` /
`loadGenerators` run only the application's own blocks and skip every
framework railtie's: a railtie's `console do … end` never fires under the
application.

`run_tasks_blocks` (560-569) is out of scope: its body loads `rails/tasks.rb`
and defines `task :environment`, which belongs to
`port-rake-dsl-task-manager-for-app-tasks`.

## Converged shape

- `Application#rakeTasks(block)`, `#initializer(name, opts, block)`,
  `#runner(blk)`, `#console(blk)`, `#generators(blk)`, each delegating to
  `(this.constructor as typeof Application).<name>(…)`. They sit with
  `server`, in Rails' order, ahead of `requireEnvironmentBang`.
- `Application#runGeneratorsBlocks` / `#runRunnerBlocks` /
  `#runConsoleBlocks` (`@internal`), each looping `this.railties()` and then
  calling `super`, placed before `runServerBlocks` in Rails' order.
- These runners stay synchronous unless a caller needs async. See
  `packages/trailties/CLAUDE.md` § "Server blocks are awaited", which says
  widening them is its own decision.

## Acceptance criteria

- Each forwarder registers on the application class.
- Each override runs a registered railtie's block before the application's.
- Tests named after Rails' where one exists
  (`railties/test/railties/railtie_test.rb`: "console block is executed when
  MyApp.load_console is called", "runner block is executed when
  MyApp.load_runner is called", "generators block is executed when
  MyApp.load_generators is called" — already ported for Trailtie; add the
  Application path); trails-only cases in `application.trails.test.ts`.
