---
title: "app-generator-required-railties-framework-requires"
status: done
updated: 2026-10-29
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9429
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' generated `config/application.rb` requires `rails/all` only when every
entry of `required_railties` is on, and otherwise one require per framework,
commenting out a skipped one
(`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:298-316`,
`rails_require_statement`). `shared_generator_tests.rb:240,335` assert
`# require "action_cable/engine"` under `--skip-action-cable`.

trails' generated `config/application.ts` always imports
`@blazetrails/trailties/all` (`packages/trailties/src/generators/app-generator.ts`,
`createConfigFiles`), so a skipped framework's trailtie still loads.
`@blazetrails/trailties` exports no per-trailtie subpath (`package.json` `exports`).

## Acceptance criteria

- `AppBase#requiredRailties`, `#includeAllRailties` and `#railsRequireStatement` ported.
- Per-trailtie subpath exports exist (`@blazetrails/trailties/action-cable/engine`, …).
- `test_generator_if_skip_action_cable_is_given`'s commented-require assertion ported.
