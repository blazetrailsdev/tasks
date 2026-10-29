---
rfc: "0000-rake-gem-port"
title: "Rake: a direct port of rake 13.2.1, and trailties' task dispatch converged onto it"
status: draft
created: 2026-10-29
updated: 2026-10-29
owner: "@deanmarano"
packages:
  - rake
  - trailties
  - "scripts"
clusters:
  - port
  - fidelity
related-rfcs:
  - "0171-thor-port"
  - "0142-trailties-surfaced-deviations"
---

<!-- Unnumbered until merge. -->

# RFC — Rake

## Summary

Rails runs its tasks on Rake, and trails has no Rake. `bin/rails db:migrate`
reaches `Rails::Command::RakeCommand`, which boots `Rake.application`, loads
every railtie's `rake_tasks` blocks and `lib/tasks/*.rake`, and invokes the
task by name. trails' stand-in, `invokeRake` in
`packages/trailties/src/command.ts:61`, re-parses the arguments through the
Commander CLI instead, so there is no task graph: no prerequisites, no
once-only `invoke`, no `enhance`, no `namespace`. This RFC ports the core of
rake 13.2.1 — the version `vendor/rails/v8.0.2/Gemfile.lock:455` resolves — as
`@blazetrails/rake`, the way `0171-thor-port` ported Thor, and converges
trailties' dispatch onto it.

## Motivation

- **Rails leans on it.** 15 `.rake` files in `vendor/rails/v8.0.2/*/lib`
  (1,172 lines: `databases.rake`, `framework.rake`, `tmp.rake`, `log.rake`,
  `zeitwerk.rake`, `activestorage.rake`, …), plus `railties/lib/rails/tasks.rb`,
  `engine.rb` / `railtie.rb` (`rake_tasks`, `load_tasks`),
  `commands/rake/rake_command.rb` and `test_unit/runner.rb`.
- **The backlog already assumes it.** `port-rake-dsl-task-manager-for-app-tasks`
  (0142), `port-rails-command-rake-command`,
  `move-db-commands-onto-databases-rake-tasks-part-1` / `-part-2` and
  `move-app-template-command-onto-framework-rake-task` (0171), and
  `database-tasks-run-migration-stands-in-for-rake-inlined-context` (0189) each
  need a real Rake underneath. Thor's `rake_compat.rb` is unported for the same
  reason.
- **It is small.** rake 13.2.1's `lib/` is 44 files, about 4,500 lines. The
  core this RFC ports is about 3,200 of them.

## Design

### A package, ported line for line

`packages/rake` mirrors `lib/rake/*.rb` file for file, under the repo's usual
rules (CLAUDE.md § "Fidelity is the job"): Rails-style names, control flow and
decomposition, errors with the same class and message, and enrolment in
`parity:api` / `parity:test` like every other ported gem.

### Tests are native Vitest

rake's suite (`test/`) is Minitest. It is ported as native Vitest, not run on
a Minitest shim: each `def test_foo` becomes an `it` in a `*.test.ts` beside
the file it covers, named so `parity:test` matches it, and each assertion is a
Vitest `expect` by the table in CONTRIBUTING.md § "Porting a Minitest
assertion" — the built-in matcher by default, a `@blazetrails/vitest-matchers`
matcher where the built-in gives the wrong answer for the value. Minitest's
setup and teardown (`Rake::TestCase`, `test/helper.rb`) become `beforeEach` /
`afterEach`.

The core:

| Group                  | Ruby files                                                                                                                                                             | Ruby lines |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Task and arguments     | `task.rb`, `task_arguments.rb`, `invocation_chain.rb`, `linked_list.rb`, `invocation_exception_mixin.rb`, `task_argument_error.rb`, `rule_recursion_overflow_error.rb` | ~600       |
| Task manager and scope | `task_manager.rb`, `scope.rb`, `name_space.rb`                                                                                                                         | ~570       |
| DSL and file tasks     | `dsl_definition.rb`, `file_task.rb`, `file_creation_task.rb`, `early_time.rb`, `late_time.rb`, `multi_task.rb`, `phony.rb`, `tasklib.rb`                               | ~360       |
| File utilities         | `file_utils.rb`, `file_utils_ext.rb`                                                                                                                                   | ~270       |
| Application            | `application.rb`, `rake_module.rb`, `default_loader.rb`, `trace_output.rb`, `backtrace.rb`, `pseudo_status.rb`, `private_reader.rb`, `cloneable.rb`, `rake.rb`         | ~1,300     |

### Task actions and `invoke` are async

A task action does I/O (a migration, a file write), so it returns a promise,
and `Task#invoke` / `#execute` / `invoke_prerequisites` await each step Ruby
runs in line. This is the ruling CLAUDE.md § "Thor dispatch is async" and
§ "A job's `perform` and `enqueue` are async" already apply; it is not a new
decision.

### `multitask` without a thread pool

`MultiTask#invoke_prerequisites` hands each prerequisite to
`application.thread_pool` (`multi_task.rb`, `thread_pool.rb`). Node's event
loop already runs the awaited prerequisites concurrently, so `multitask` awaits
them together and `thread_pool.rb`, `promise.rb`, `cpu_counter.rb` and
`thread_history_display.rb` are not ported. They are a `SCOPED_SKIP_GROUPS`
entry citing this RFC, the shape CLAUDE.md § "Node's event loop stands in for
Action Cable's nio4r selector" uses.

### A `.rake` file is a TypeScript module

A Rakefile or `lib/tasks/*.rake` is Ruby evaluated with `load`. trails' tasks
are TypeScript modules calling the DSL (`task`, `namespace`, `desc`, `file`),
loaded by `Rake.application`'s loader with an awaited `import()`, the shape
CLAUDE.md § "A migration file is loaded by `Kernel#load`" settles (`rbFLoad`).
The default task file names become `Rakefile.ts` / `rakefile.ts` and
`lib/tasks/*.ts`.

### trailties converges onto it

`invokeRake` becomes Rails' `RakeCommand#perform`: boot `Rake.application`,
`Rails.application.load_tasks`, invoke the task. `Trailtie.rakeTasks` blocks
then run against a real `Rake.application`, and the commands Rails implements
as tasks (`db:*`, `app:template`) move onto tasks, which is what the existing
0171 stories ask for.

## Non-goals

- **`packagetask.rb`, `testtask.rb`, `clean.rb`:** gem packaging, a Minitest
  runner (trails tests run on Vitest) and `CLEAN`/`CLOBBER` have no caller in
  Rails' lib. Ported when one appears.
- **`file_list.rb`, `ext/string.rb`, `ext/core.rb`:** `FileList` has 2 uses in
  Rails' lib, and `ext/` monkeypatches `String`. Deferred to the first caller.
- **`loaders/makefile.rb`, `win32.rb`, `rake_test_loader.rb`:** no caller.
- **Their tests:** `test_rake_clean.rb`, `test_rake_file_list.rb`,
  `test_rake_file_list_path_map.rb`, `test_rake_path_map*.rb`,
  `test_rake_package_task.rb`, `test_rake_test_task.rb`,
  `test_rake_rake_test_loader.rb`, `test_rake_makefile_loader.rb`,
  `test_rake_win32.rb`, `test_rake_extension.rb`, `test_rake_reduce_compat.rb`,
  and the thread-pool trio (`test_rake_thread_pool.rb`,
  `test_rake_cpu_counter.rb`, `test_thread_history_display.rb`) stay unported
  with their files. Every other file in rake's `test/` is assigned to a story.
- **The `rake` executable as a separate CLI.** Tasks run through `bin/rails`,
  as Rails apps do today. `Application#run`'s option parsing is ported, so a
  `bin/rake` stub is a one-file follow-up if wanted.

## Alternatives considered

- **Keep the Commander-based `invokeRake`.** It has no task graph, and every
  story listed under Motivation is blocked on one.
- **Express tasks as Thor commands.** Rails keeps the two apart
  (`Rails::Command` is Thor, tasks are Rake), and `rake_command.rb` bridges
  them. Merging them is invented surface.
- **An npm task runner.** Not Rails' API; the `.rake` DSL and `Rake::Task`
  surface Rails code calls would have no port.

## Rollout

1. `vendor-rake-13-2-1`, then `rake-package-skeleton`.
2. `rake-task-and-arguments`, `rake-task-manager-and-scope` (needs the task).
3. `rake-dsl-and-file-tasks`, `rake-file-utils`.
4. `rake-application-options-and-loading`, `rake-application-top-level-run`.
5. `port-rake-dsl-task-manager-for-app-tasks` is rehomed here after merge and
   converges trailties' `invokeRake` onto `Rake.application`. The 0171 and
   0189 stories under Motivation then gain a dep on it.

## Verification

- `parity:api` reports rake's ported files at 100% of their non-skipped
  members, and `parity:test` matches each ported rake test by name.
- `invokeRake` is deleted, and `bin/rails db:migrate` reaches a
  `Rake::Task#invoke` (a trailties test pins it).

## Open questions

1. **Package name and dependency direction.** `@blazetrails/rake`, depending
   on ruby-compat only; trailties depends on it. Recommended.

## Changelog

- 2026-10-29: initial RFC
