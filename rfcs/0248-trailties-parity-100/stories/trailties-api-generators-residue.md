---
title: "trailties: close the generator-module API misses"
status: ready
updated: 2026-11-18
rfc: "0248-trailties-parity-100"
cluster: api-residuals
packages: [trailties]
deps: [trailties-api-app-base-gemfile-entries]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Members missing from `parity:api --missing`:

- `generators.rb`: `namespace`, `namespace=`, `hide_namespace`, `file_lookup_paths`
- `generators/actions.rb`, `generators/base.rb`: `github`, `append_file_with_newline` (both), `hide!`
- `generators/database.rb`: `gem`
- `generators/generated_attribute.rb`: `print_attribute_options`
- `generators/model_helpers.rb`, `rails/model/model_generator.rb`: `skip_warn` / `skip_warn=` (×3)
- `generators/named_base.rb`: `application_name`
- `generators/active_record/migration/migration_generator.rb`: `validate_file_name!`
- `rails/app/app_generator.rb`: `create_script_folder`, `delete_assets_initializer_skipping_asset_pipeline`, `delete_application_record_skipping_active_record`, `delete_action_cable_files_skipping_action_cable`, `finish_template`, `file`, `ruby_version`, `script`, `handle_rails_rc!`
- `rails/benchmark/benchmark_generator.rb`: `add_ips_to_gemfile`, `ips_installed?`
- `rails/db/system/change/change_generator.rb`: `edit_gemfile`
- `rails/encrypted_file/encrypted_file_generator.rb`: `encrypted_file_template`
- `test_unit/scaffold/scaffold_generator.rb`: `boolean?`, `datetime?`, `time?`

## Acceptance criteria

- [ ] Every member listed above is matched in `pnpm parity:api -- --package trailties --missing`.
- [ ] Each new member follows the Rails body; deviations go through the root CLAUDE.md process.
