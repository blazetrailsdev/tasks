---
title: "migration-generator-remove-reference-drops-foreign-key"
status: ready
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' migration template emits the foreign key on `remove_reference` for a
`belongs_to` / `references` attribute:

```erb
# activerecord/lib/rails/generators/active_record/migration/templates/migration.rb.tt:35
remove_reference :<%= table_name %>, :<%= attribute.name %><%= attribute.inject_options %><%= foreign_key_type %>
```

and `test_remove_migration_with_references_removes_foreign_keys`
(`railties/test/generators/migration_generator_test.rb:126-138`) asserts
`remove_reference :books, :author,.*\sforeign_key: true`.

trails' `MigrationGenerator`
(`packages/trailties/src/generators/migration-generator.ts:280-282`) emits
`removeReference("books", "author")` with no `foreignKey`, and its test
(`migration-generator.test.ts`, "remove migration with references removes
foreign keys") asserts the inverse of Rails with `assertNoMatch`.

## Acceptance criteria

- `removeReference` for a non-polymorphic reference carries `foreignKey: true`,
  mirroring `foreign_key_type` in the template.
- The test body asserts what Rails' does, in Rails' order: author matches
  `foreignKey: true`, distributor line present, distributor has no `foreignKey`.
