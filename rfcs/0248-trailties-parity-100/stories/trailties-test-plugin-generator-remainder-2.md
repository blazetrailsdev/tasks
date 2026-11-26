---
title: "trailties-test-plugin-generator-remainder-2"
status: draft
updated: 2026-11-26
rfc: "0248-trailties-parity-100"
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

Remainder of `trailties-test-plugin-generator-remainder`, which ported the git
author/license, app package.json entry and version-constraint tests and parked
the asset-pipeline, debugger and development-dependency rows. Still Miss for
`vendor/rails/v8.0.5.2/railties/test/generators/plugin_generator_test.rb`
(ported tests: `packages/trailties/test/generators/plugin-generator.test.ts`):

- git default branch: `:138`, `:150` (mutate global `git config init.defaultBranch`).
- `:167` full mode with almost all skip options (asserts `bin/trails` framework requires).
- `:217`, `:222` `-m` template runs from `fixtures_root` (need fixture templates and `FileUtils.cd`).
- `:236` default database dependency is sqlite, `:242` custom database dependency: the plugin's
  `templates/package.json.tt` does not use `packageEntries()` (`lib/generators/app-base.ts:522`),
  so `databasePackageEntry` never reaches it; Rails' `plugin/templates/Gemfile.tt` emits `gemfile_entries`.
- `:260` no duplicate gemfile entries when using prerelease; `:268`, `:275` generation does not run bundle install.
- `:712`, `:731` plugin created by name after `FileUtils.cd(destination_root)` inside an app.
- `:616` dummy application uses dynamic rails version number (`application.rb.tt:10-15` dummy arm).
- subprocess `bin/trails g ...` inside the engine: `:301`, `:578`, `:743`, `:836`, `:853`, `:862`, `:875`, `:890`, `:903`.

## Acceptance criteria

- [ ] Every test above matched in `pnpm parity:test -- --package trailties`, or parked `PERMANENT-SKIP:` citing a CLAUDE.md section.
- [ ] Plugin `package.json.tt` converged onto `packageEntries()` so the database entry lands.
