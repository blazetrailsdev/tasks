---
title: "trails new --dev: link: overrides leave the app's template imports unresolvable"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails new --dev` writes `link:` overrides for every checkout package into `pnpm-workspace.yaml` (`packages/trailties/lib/generators/trails/app/templates/pnpm-workspace.yaml.tt`), while `trailsPackageEntry` (`packages/trailties/lib/generators/app-base.ts`) lists only `@blazetrails/trails` (#10659). pnpm never installs a `link:` package's own dependencies, so `publicHoistPattern: "@blazetrails/*"` hoists nothing, and the generated `config/application.ts` cannot resolve `@blazetrails/ruby-compat`, `@blazetrails/trailties`, `@blazetrails/activesupport` and the rest. The README Quickstart hit the same break and worked around it in trails#10714 by adding the meta-package's deps plus ruby-compat as direct `link:` deps. Rails' `--dev` (`railties/lib/rails/generators/app_base.rb`, `rails_gemfile_entry` with `path:`) works because Bundler puts every gem's deps on the load path.

## Acceptance criteria

- An app generated with `--dev` and installed with `pnpm install` boots and runs `prepare` (`trails-tsc-views build`) with no manual edits.
- A trailties test generates a `--dev` app, installs it, and fails on the current main.
- The README Quickstart workaround from trails#10714 is removed if `--dev` makes it redundant.
