---
title: "trails-new-parses-app-generator-class-options"
status: ready
updated: 2026-11-01
rfc: "0212-trailties-port"
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

`packages/trailties/src/commands/new.ts` parses `trails new` with commander and forwards only a few options, so most class options from `vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:32-135` and `rails/app/app_generator.rb:289-295` (`--skip-active-record`, `--skip-javascript`, `--version`, every `--no-skip-x`) are rejected.

## Acceptance criteria

- `trails new` parses through `AppGenerator`'s Thor class options, including `--no-` negations and aliases.
- The commander option list in new.ts is removed.
