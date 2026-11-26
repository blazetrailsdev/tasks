---
title: "trailties-test-plugin-generator-remainder"
status: done
updated: 2026-11-26
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10778
claim: "2026-11-26T02:29:50Z"
assignee: "trailties-test-application-configuration-harness-remainder"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `trailties-test-plugin-generator`. Still Miss in
`pnpm parity:test -- --package trailties` for
`vendor/rails/v8.0.5.2/railties/test/generators/plugin_generator_test.rb`
(ported tests live in `packages/trailties/test/generators/plugin-generator.test.ts`):

- git: `initializes_git_repo_with_main_branch_without_user_default` (:138), `version_control_initializes_git_repo_with_user_default_branch` (:150), `git_name_and_email_in_gemspec_file` (:756), `git_name_in_license_file` (:767), `no_year_in_license_file` (:776)
- options/dummy: `generating_in_full_mode_with_almost_of_all_skip_options` (:167), `inclusion_of_a_debugger` (:187), `generating_test_files_in_full_mode_without_unit_test_files` (:198), `generating_adds_dummy_app_rake_tasks_without_unit_test_files` (:211), `ensure_that_plugin_options_are_not_passed_to_app_generator` (:217), `ensure_that_test_dummy_can_be_generated_from_a_template` (:222), `ensure_that_skip_active_record_option_is_passed_to_app_generator` (:248), `ensure_that_database_option_is_passed_to_app_generator` (:255)
- package.json mapping (packages/trailties/CLAUDE.md § "A Gemfile is a package.json"): `no_development_dependencies_in_gemspec` (:229), `default_database_dependency_is_sqlite` (:236), `custom_database_dependency` (:242), `no_duplicate_gemfile_entries_when_using_prerelease` (:260), `generation_does_not_run_bundle_install*` (:268, :275), `gemspec_uses_optimistic_rails_version_constraint` (:522), `creating_plugin_in_app_directory_adds_gemfile_entry` (:702), `creating_plugin_only_specify_plugin_name_in_app_directory_adds_gemfile_entry` (:712), `skipping_gemfile_entry` (:721), `creating_plugin_in_application_skips_license` (:731)
- asset pipeline (propshaft is permanent-not-ported; Vite instead): :640, :650, :657, :667, :677
- subprocess `bin/trails g ...` inside the engine: :301, :578, :743, :836, :853, :862, :875, :890, :903
- `dummy_application_uses_dynamic_rails_version_number` (:616): the dummy arm of `app/templates/config/application.rb.tt:10-15` (`config.load_defaults Rails::VERSION::STRING.to_f`) is unported; `packages/trailties/lib/generators/trails/app/templates/config/application.ts.tt:25` always writes the literal, and `Configuration#loadDefaults`' `String(targetVersion)` renders `8.0` as `"8"`, so a Float arm needs Ruby `Float#to_s`.

## Acceptance criteria

- [ ] Every test above is matched in `pnpm parity:test -- --package trailties`, no Miss left for plugin_generator_test.rb.
- [ ] Permanent rows parked `it.skip` under `PERMANENT-SKIP:` citing the CLAUDE.md section.
- [ ] Lib fixes land with the tests.
