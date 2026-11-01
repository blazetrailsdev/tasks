---
title: "Port railties' isolation abstract_unit: Paths, Generation and the app template"
status: done
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: tt-harness
packages: ["trailties"]
deps: ["activesupport-testing-isolation-subprocess"]
deps-rfc: []
est-loc: 600
priority: null
pr: trails#9587
claim: "2026-11-01T20:26:42Z"
assignee: "trailties-isolation-abstract-unit-generation"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/isolation/abstract_unit.rb` is the harness for 58
`test/application/**` files. This story covers `TestHelpers::Paths` and
`TestHelpers::Generation`: `build_app` (`:107-153`), `teardown_app`
(`:155`), `add_to_config` / `add_to_env_config` / `remove_from_env_config`
(`:434-460`), `app_file` (`:466`), `controller`, `use_frameworks`. It
also covers the once-per-run app template (`:618-630`, `rails new
tmp/app_template --skip-bundle` plus the boot.rb and `Bundler.require`
rewrites). trailties has no such harness, so
`isolation-test-app-builder-strips-eslint-autocorrect-line` (RFC 0142) has
nothing to converge onto.

## Acceptance criteria

- `packages/trailties/src/test-helpers/isolation/abstract-unit.ts` ports
  those modules at their Rails names.
- The template is generated once by `trails new` in vitest `globalSetup`
  and copied per test, as in Rails.
- The tests in `vendor/rails/v8.0.2/railties/test/isolation/test_helpers_test.rb` (4) pass.
