---
title: "port-rails-command-usage-files-and-their-build"
status: draft
updated: 2026-11-01
rfc: "0171-thor-port"
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

`Rails::Command::Base#class_usage` (`vendor/rails/v8.0.2/railties/lib/rails/command/base.rb:122-126`) renders `commands/<ns>/USAGE`; `packages/trailties/src/command/base.ts` `classUsage` loads the precompiled `USAGE.js` through ruby-compat `TSE`. Rails ships USAGE for credentials, encrypted, gem_help, help, runner and test. Trails ships none, and `build:templates` only compiles `.tt` files, so a USAGE file added today raises `LoadError` from `help`. A USAGE source calls `executable()`, not bare `executable`.

## Acceptance criteria

- The Rails USAGE files for ported commands exist under `commands/<ns>/` and reach `dist`.
- `build:templates` emits `USAGE.js` for each, and `bin/rails <command> --help` prints the render.
