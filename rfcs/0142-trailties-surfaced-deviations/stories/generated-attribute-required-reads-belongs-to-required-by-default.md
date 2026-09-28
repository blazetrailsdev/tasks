---
title: "generated-attribute-required-reads-belongs-to-required-by-default"
status: in-progress
updated: 2026-09-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8198
claim: "2026-09-27T23:04:27Z"
assignee: "engine-called-from-never-seated"
blocked-by: null
closed-reason: null
---

## Context

Rails' `GeneratedAttribute#options_for_migration`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/generated_attribute.rb:236-246`) adds
`null: false` when `required?` answers true, and `required?` (`:198-201`) is
`reference? && Rails.application.config.active_record.belongs_to_required_by_default`.

trails' `packages/trailties/src/generators/generated-attribute.ts` ports
`optionsForMigration` (trails#8147) but has no `required?`, because
`ActiveRecordConfig` in `packages/trailties/src/trailties/active-record.ts` carries no
`belongsToRequiredByDefault`. The omission is receipted
`@missingRailsCall required? — CONVERGEABLE generated-attribute-required-reads-belongs-to-required-by-default`.
The Rails tests "add migration with references adds null false by default" and
"add migration with references does not add belongs to when required by default global config is false"
(`railties/test/generators/migration_generator_test.rb`) are `it.skip` in
`packages/trailties/src/generators/migration-generator.test.ts`.

## Acceptance criteria

- `GeneratedAttribute` has `required?` reading the application's
  `config.activeRecord.belongsToRequiredByDefault`, and `optionsForMigration` calls it.
- The `@missingRailsCall` receipt is removed.
- The two skipped Rails tests are ported.
