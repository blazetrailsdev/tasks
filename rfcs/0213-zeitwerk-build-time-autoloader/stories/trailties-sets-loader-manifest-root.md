---
title: "trailties-sets-loader-manifest-root"
status: draft
updated: 2026-11-01
rfc: "0213-zeitwerk-build-time-autoloader"
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

`Loader#manifestRoot` (`packages/zeitwerk/src/loader.ts`, trails#9588) defaults to `Dir.pwd()`. Only `buildAutoload` sets it, so a booted app whose loader reads a manifest resolves rows against the current directory, not the application root. `setup_main_autoloader` (`vendor/rails/v8.0.2/railties/lib/rails/application/finisher.rb:17`) and `Rails::Autoloaders` (`railties/lib/rails/autoloaders.rb`) are where the port creates the loaders.

## Acceptance criteria

- `Trails.autoloaders.main` and `once` get `manifestRoot` set to `config.root`.
- A test boots from a directory other than the app root and reads a built manifest.
