---
title: "port-remaining-plugin-generator-tests"
status: draft
updated: 2026-11-06
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

trails#9797 ported `PluginGenerator` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/plugin/plugin_generator.rb:201-501`) and 31 of the 80 tests in `vendor/rails/v8.0.2/railties/test/generators/plugin_generator_test.rb` into `packages/trailties/src/generators/plugin-generator.test.ts`. The 800 LOC ceiling left the rest unported:

- Gemfile / Bundler assertions (`test_no_duplicate_gemfile_entries_when_using_prerelease`, `test_generation_does_not_run_bundle_install*`, `test_skipping_gemfile_entry`, `test_creating_plugin_in_app_directory_adds_gemfile_entry`, `test_creating_plugin_only_specify_plugin_name_in_app_directory_adds_gemfile_entry`, `test_creating_plugin_in_application_skips_license`), which use `with_simulated_app` (`plugin_generator_test.rb:946-955`), meaning `APP_PATH` set on the app-path module.
- The hyphenated and underscored mountable/full variants (`:328-363`, `:398-463`), `test_create_mountable_application_with_mountable_option` (`:368`), and the asset-pipeline tests (`:640-683`).
- The git name/email/license tests (`:756-784`), the template-driven ones (`:222`, `:624`), the API dummy ones (`:820-852`), the mountable model/mailer/job generation tests (`:853-902`), `test_app_update_generates_bin_file` (`:903`), and `SharedGeneratorTests` (`shared_generator_tests.rb`).

## Acceptance criteria

- Every remaining test in `plugin_generator_test.rb` and `shared_generator_tests.rb` that the generator harness can run is ported into `plugin-generator.test.ts`, with Rails test names verbatim.
- Any test that needs the isolation harness is parked as `it.skip` under a `PERMANENT-SKIP:` or CONVERGEABLE line that names its blocker.
