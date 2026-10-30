---
title: "Port Rake::TaskManager, Scope and NameSpace"
status: ready
updated: 2026-10-29
rfc: "0211-rake-gem-port"
cluster: port
packages: [rake]
deps:
  - rake-task-and-arguments
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rake/v13.2.1/lib/rake/task_manager.rb` (333 lines), `scope.rb`, `name_space.rb`: `define_task`, `[]` lookup with scope resolution, `in_namespace`, `resolve_args`, rules (`enhance_with_matching_rule`) and `tasks_in_scope`.

## Acceptance criteria

- [ ] Ported at the Ruby paths and names; `Rake::Task[name]` raises the same "Don't know how to build task" `RuntimeError`.
- [ ] Rules are ported, including `RuleRecursionOverflowError`.
- [ ] `test/test_rake_task_manager.rb`, `test_rake_task_manager_argument_resolution.rb`, `test_rake_scope.rb`, `test_rake_name_space.rb` and `test_rake_rules.rb` port as native Vitest (`expect` and `@blazetrails/vitest-matchers`, per the rake RFC § "Tests are native Vitest"), names matching for `parity:test`.
