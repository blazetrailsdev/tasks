---
title: "vite:verify_install enhances :environment (Gem.loadedSpecs is never seated)"
status: closed
updated: 2026-11-16
rfc: "0240-vite-trails-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: seating Gem.loadedSpecs ports RubyGems, which is not ported; the guard is constantly true since vite-trails' package.json depends on @blazetrails/trailties. Replaced by vite-trails-verify-install-always-enhances-environment."
---

## Context

`vendor/vite_ruby/v3.11.1/vite_rails/lib/tasks/vite.rake:5` is `Rake::Task["vite:verify_install"].enhance([:environment]) if Gem.loaded_specs["rails"]`. Its port, `packages/vite-trails/lib/tasks/vite.ts` (trails#10200), guards on `Gem.loadedSpecs["trails"]`. Nothing in trails populates `Gem.loadedSpecs` (`packages/ruby-compat/lib/gem.ts:89` is an empty record, and no package writes to it). So the arm never runs, and `vite:verify_install` / `assets:precompile` do not boot the app's `environment` task first, as they do under Rails. This shares a root cause with `vite-assets-require-framework-libraries-loads-vite-trails`, where `framework_libraries` reads the same table.

## Acceptance criteria

- `Gem.loadedSpecs` is seated for loaded trails packages, like Bundler's `Gem.loaded_specs`, keyed by the Rails gem name per the rails→trails token rename, with `name` and `version`.
- In a trails app, `vite:verify_install` has `environment` as a prerequisite, as in `vite.rake:5`.
- A test asserts the prerequisite after loading `lib/tasks/vite.ts` with the spec seated.
