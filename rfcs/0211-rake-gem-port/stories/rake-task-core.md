---
title: "Port Rake::Task's instance methods (invoke, enhance, comments)"
status: draft
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: port
packages: ["rake"]
deps: ["rake-task-and-arguments"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `rake-task-and-arguments` for the PR LOC ceiling: that PR ported `LinkedList`, `InvocationChain`, `InvocationExceptionMixin`, `TaskArguments`, `TaskArgumentError` and `RuleRecursionOverflowError` (`packages/rake/src/`). `Rake::Task` itself (`vendor/rake/v13.2.1/lib/rake/task.rb:15-376`) is not yet on main.

A complete, lint-clean port of the instance side already exists on the branch `wip/rake-task-core` (commit 201a40c9df): `packages/rake/src/task.ts` (~336 lines) and `test-rake-task.trails.test.ts` (invoke-once, prerequisites first, circular dependency, re-raise until `reenable`, args, comments, `clear*`). Start from it: `git checkout origin/wip/rake-task-core -- packages/rake/src/task.ts packages/rake/src/test-rake-task.trails.test.ts`, re-add the `Task` export and class-path row, then delete the branch. Notes from it:

- `invoke`, `invoke_with_call_chain`, `invoke_prerequisites` and `execute` are async (RFC 0211 § "Task actions and `invoke` are async"); `@lock.synchronize` is ruby-compat's `Monitor#synchronize`.
- `invoke_prerequisites_concurrently` awaits `Promise.all` in place of `application.thread_pool` (RFC § "`multitask` without a thread pool").
- A `TaskApplication` interface stands in for `Rake::Application` until `rake-application-options-and-loading` lands.
- `parity:api` scored `task.rb` 47/54 with the class methods, `format_deps` and `|` left to `rake-task-class-methods-and-dsl-tests`.

## Acceptance criteria

- [ ] `Rake::Task`'s instance methods are ported at `packages/rake/src/task.ts`; `invoke` runs a task once, prerequisites first, and raises `RuntimeError` "Circular dependency detected".
- [ ] `enhance`, `reenable`, `clear*`, `arg_names`, `comment` / `full_comment` / `add_description` match Ruby.
- [ ] `parity:api:extra` reports no extra surface on `task.ts`; `wip/rake-task-core` is deleted.
