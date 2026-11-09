---
title: "generators-gemfile-templates-converge-onto-package-json"
status: draft
updated: 2026-11-09
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

Four generator sites still carry receipts that point at the Gemfile family story. They converge the Gemfile _templates_, not the `gem` / `gem_group` actions, which trails#9927 ported onto `package.json` (`packages/trailties/lib/generators/actions.ts`):

- `packages/trailties/lib/generators/app-base.ts` `trailsGemfileEntry`: `@missingRailsCall rails_version_specifier` (`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb`, `rails_gemfile_entry` / `rails_version_specifier`).
- `packages/trailties/lib/generators/trails/plugin/plugin-generator.ts`:
  - `gemfile` and `gemspec`: `@missingRailsArgs template` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/plugin/plugin_generator.rb`, `gemfile` / `gemspec` templates).
  - `gemfileEntry`: `@missingRailsArgs join`. It also hand-edits `package.json` where Rails uses `append_file gemfile_in_app_path, entry`. It could call the new `gem` action instead.

## Acceptance criteria

- [ ] `trailsGemfileEntry` calls a ported `trailsVersionSpecifier` the way `rails_gemfile_entry` calls `rails_version_specifier`.
- [ ] `PluginBuilder#gemfile` / `#gemspec` pass the template arguments Rails passes.
- [ ] `PluginBuilder#gemfile_entry` follows Rails' body, using the `gem` / `package.json` shape from `actions.ts`.
- [ ] The four receipts are deleted.
