---
title: "trailties-isolation-make-basic-app-and-unhealthy-database"
status: ready
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps:
  - trailties-isolation-abstract-unit-boot-and-rails-command
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

`packages/trailties/src/test-helpers/isolation/abstract-unit.ts` ports `TestHelpers::Paths` and most of `TestHelpers::Generation`. Two Generation methods remain: `make_basic_app` (`vendor/rails/v8.0.2/railties/test/isolation/abstract_unit.rb:260-285`, an anonymous `Rails::Application` subclass plus `Rack::Test::Methods`) and `with_unhealthy_database` (`:242-256`, `SchemaCache._load_from` plus `switch_env`). Both boot or load framework state, so they follow `trailties-isolation-abstract-unit-boot-and-rails-command`.

## Acceptance criteria

- `Generation` carries `makeBasicApp` and `withUnhealthyDatabase` at their Rails names, with Rails' control flow.
- One ported `railties/test/application` test exercises each.
