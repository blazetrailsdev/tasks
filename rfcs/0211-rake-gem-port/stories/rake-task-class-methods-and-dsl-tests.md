---
title: "Port Rake::Task's class methods, | and the DSL-dependent task tests"
status: in-progress
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: port
packages: ["rake"]
deps:
  - rake-task-and-arguments
  - rake-application-options-and-loading
  - rake-dsl-and-file-tasks
deps-rfc: []
est-loc: 650
priority: null
pr: trails#9513
claim: "2026-10-30T22:36:42Z"
assignee: "rake-task-class-methods-and-dsl-tests"
blocked-by: null
closed-reason: null
---

## Context

`rake-task-and-arguments` ported `Rake::Task` (`packages/rake/src/task.ts`), `TaskArguments`, `InvocationChain`, `LinkedList` and the error classes, but left out the members that need `Rake.application` or `FileList`:

- `class << self` (`vendor/rake/v13.2.1/lib/rake/task.rb:378-431`): `clear`, `tasks`, `[]`, `task_defined?`, `define_task`, `create_rule`, `scope_name`.
- `self.format_deps` and `|` (`task.rb:365-375`), which call `Rake.from_pathname` (`file_list.rb:429-433`).
- `TaskApplication` in `task.ts` is an interface standing in for `Rake::Application`; replace it with the real class once ported.

The Ruby tests that drive tasks through the `task` DSL and `Rake.application` were not ported: all of `test/test_rake_task.rb` and `test/test_rake_task_with_arguments.rb`, and the three `parse_task_string` tests in `test/test_rake_task_arguments.rb:121-148` (noted in `packages/rake/src/task-arguments.test.ts`).

## Acceptance criteria

- [ ] The class methods, `format_deps` and `|` (operator spelling pinned in `scripts/api-compare/operator-order-spelling.ts`) are ported at their Ruby names.
- [ ] `test_rake_task.rb`, `test_rake_task_with_arguments.rb` and the three `parse_task_string` tests port as native Vitest with names matching for `parity:test`.
- [ ] `TaskApplication` is deleted in favour of `Rake::Application`.
