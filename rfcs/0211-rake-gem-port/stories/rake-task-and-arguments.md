---
title: "Port Rake::Task, TaskArguments and InvocationChain"
status: ready
updated: 2026-10-29
rfc: "0211-rake-gem-port"
cluster: port
packages: [rake]
deps: [rake-package-skeleton]
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rake/v13.2.1/lib/rake/task.rb` (434 lines) with `task_arguments.rb`, `invocation_chain.rb`, `linked_list.rb`, `invocation_exception_mixin.rb`, `task_argument_error.rb` and `rule_recursion_overflow_error.rb`. `invoke`, `invoke_with_call_chain`, `invoke_prerequisites` and `execute` are async (rake RFC § "Task actions and `invoke` are async").

## Acceptance criteria

- [ ] Each file is ported at its Ruby path and names; `invoke` runs a task once, prerequisites first, and raises `RuntimeError` "Circular dependency detected" as `invocation_chain.rb` does.
- [ ] `enhance`, `reenable`, `clear*`, `arg_names`, `comment` / `full_comment` / `add_description` match Ruby.
- [ ] rake's `test/test_rake_task.rb`, `test_rake_task_arguments.rb`, `test_rake_invocation_chain.rb`, `test_rake_linked_list.rb` and `test_rake_task_with_arguments.rb` port as native Vitest (`expect` and `@blazetrails/vitest-matchers`, per the rake RFC § "Tests are native Vitest"), names matching for `parity:test`, using a minimal application stub only where the Ruby test does.
