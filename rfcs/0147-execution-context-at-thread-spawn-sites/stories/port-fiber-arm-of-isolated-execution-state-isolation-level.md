---
title: "port-fiber-arm-of-isolated-execution-state-isolation-level"
status: draft
updated: 2026-09-15
rfc: "0147-execution-context-at-thread-spawn-sites"
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

`IsolatedExecutionState.isolationLevel=` (`packages/activesupport/src/isolated-execution-state.ts`)
ports `activesupport/lib/active_support/isolated_execution_state.rb:13-27`, but only the
`when :thread; Thread` arm of the `@scope` case: ruby-compat has no `Fiber` seat, so
`isolationLevel = "fiber"` validates and clears but leaves `scope` at `Thread`. Rails also
declares `Fiber.attr_accessor :active_support_execution_state` (`:8`).

## Acceptance criteria

- [ ] ruby-compat exports a `Fiber` with `Fiber.current()` (Ruby core `Fiber.current`).
- [ ] `isolationLevel=` gains the `when :fiber; Fiber` arm, `scope` returns `Fiber`.
- [ ] `#[] when isolation level is :fiber` (`activesupport/test/isolated_execution_state_test.rb`)
      is ported from its `it.skip` stub in `isolated-execution-state.test.ts`.
