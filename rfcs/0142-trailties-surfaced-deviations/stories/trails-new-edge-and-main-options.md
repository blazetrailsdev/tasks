---
title: "trails-new-edge-and-main-options"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
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

`trails new --dev` landed as `AppBase#railsGemfileEntry` (`packages/trailties/src/generators/app-base.ts`),
the port of `rails_gemfile_entry` (`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:460-470`).
Only the `options.dev?` and version arms are ported. The two git-branch arms are not:

- `class_option :edge` / `class_option :main, aliases: "--master"` (`app_base.rb:121-126`)
- `GemfileEntry.github("rails", "rails/rails", edge_branch, ...)` / `... "main" ...` (`app_base.rb:463-466`)
- `rails_prerelease?` (`app_base.rb:456-458`) reads all three.

The JS analogue of a `github:` Gemfile entry is a `github:blazetrailsdev/trails#<branch>` specifier,
but the packages live in a monorepo subdirectory, which pnpm/npm git specifiers only reach with
`#<branch>&path:packages/<dir>` (pnpm) — decide the specifier per package manager.

## Acceptance criteria

- `AppBase` declares `edge` and `main` (alias `--master`) class options and `railsPrerelease`.
- `railsGemfileEntry` gains the two branch arms in Rails' order, and the
  `@missingRailsCall edge? — CONVERGEABLE trails-new-edge-and-main-options` receipt on it is removed.
- `trails new --edge` / `--main` write the branch specifiers; a generator test asserts each.
