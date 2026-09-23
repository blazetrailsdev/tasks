---
title: "database-tasks-env-writer-stands-in-for-rails-env-var"
status: draft
updated: 2026-09-23
rfc: "0151-activesupport-autoload-slot-registry"
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

`packages/activerecord/src/connection-handling.ts` keeps a module-level `_railsEnv` written by
`DatabaseTasks.env =` (`tasks/database-tasks.ts`, via `_setRailsEnv`) and read by `RAILS_ENV`.
It used to live in `connection-handling-slot.ts`; `converge-activerecord-core-slots-onto-autoload`
deleted that slot and moved the state beside its only reader with a CONVERGEABLE receipt.

In Rails the two are unrelated:

- `connection_handling.rb:6` — `RAILS_ENV = -> { (Rails.env if defined?(Rails.env)) || ENV["RAILS_ENV"].presence || ENV["RACK_ENV"].presence }`
- `tasks/database_tasks.rb:60,103-105` — `attr_writer :env`; `def env; @env ||= Rails.env; end`

So `DatabaseTasks.env = "x"` does NOT move `ConnectionHandling::DEFAULT_ENV` in Rails. trails wired
it that way because ported tests translate `ENV["RAILS_ENV"] = "arunit2"`
(`activerecord/test/cases/database_configurations_test.rb:28`) into `DatabaseTasks.env = "arunit2"`.

## Acceptance criteria

- `DatabaseTasks.env=` / `env` port `attr_writer :env` / `@env ||= Rails.env` on DatabaseTasks' own state.
- `RAILS_ENV` reads only the env-var arms (ruby-compat `setEnv` / activesupport `getEnv`), and the
  ported tests that set `ENV["RAILS_ENV"]` do so through `setEnv`, not `DatabaseTasks.env =`.
- `_setRailsEnv` and its `@noRailsEquivalent CONVERGEABLE` receipt are deleted.
