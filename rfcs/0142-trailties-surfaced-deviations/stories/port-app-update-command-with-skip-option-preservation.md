---
title: "port-app-update-command-with-skip-option-preservation"
status: ready
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Port `app:update` (`Rails::Command::App::UpdateCommand`) with skip-option preservation

## Context

trails has no `app:update` command (`packages/trailties/src/commands/app.ts` only
registers `app:template`). Rails' `railties/lib/rails/commands/app/update_command.rb:55-90`
builds an `AppGenerator` with `update: true` and `generator_options` that re-derive
each skip flag from the running app — `skip_rubocop: skip_gem?("rubocop")` at `:76`,
`skip_gem?` at `:92-97` (`gem gem_name; false rescue LoadError; true`).

`AppBase` now declares `skipEslint` as a class option (`default: null`, mirroring
`app_base.rb:100`), and the app generator gates `eslint.config.mjs` / `bin/eslint`
on it, so the nil-vs-false distinction is in place for the update path to read.
The inference is the package-manifest equivalent of `skip_gem?("rubocop")`: whether
the app's `package.json` depends on `eslint`.

## Acceptance criteria

- `trails app:update` exists and runs `AppGenerator` with the update flag, mirroring
  `update_command.rb:55-90` and `app_generator.rb`'s `update_bin_files` / `bin_when_updating`.
- `generator_options` infers `skipEslint` from the manifest (port of `:76` / `:92-97`).
- Rails' `test_app_update_preserves_skip_rubocop`
  (`railties/test/generators/app_generator_test.rb:297-304`) is ported as
  `it("app update preserves skip eslint")`.
