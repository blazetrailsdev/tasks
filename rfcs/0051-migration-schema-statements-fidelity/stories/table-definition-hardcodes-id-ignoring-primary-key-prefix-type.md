---
title: "TableDefinition hardcodes 'id', ignoring primary_key_prefix_type"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5629
claim: "2026-08-02T01:17:34Z"
assignee: "table-definition-hardcodes-id-ignoring-primary-key-prefix-type"
blocked-by: null
closed-reason: null
---

## Context

`TableDefinition#setPrimaryKey` names the implicit PK column
`primaryKey ?? "id"`
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:1029`),
and the constructor path `createTable` actually uses does the same. Rails
resolves it through the model layer:

```ruby
pk = primary_key || Base.get_primary_key(table_name.to_s.singularize)
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:397`)

So `ActiveRecord::Base.primary_key_prefix_type` has no effect on emitted DDL in
trails. Surfaced by PR #5558, which had to leave
`test_create_table_with_primary_key_prefix_as_table_name_with_underscore` and
`test_create_table_with_primary_key_prefix_as_table_name`
(`change_schema_test.rb:152-170`) unported — they expect the implicit PK to be
named `testing_id` / `testingid`.

trails already has the prefix logic in
`attribute-methods/primary-key.ts:324` (`getPrimaryKey`), so this is a wiring
gap, not a missing feature. Mind the import direction —
[[project_join_table_leaf_module_import_breaks_base_init]] documents how a leaf
schema module importing Base breaks Base init.

## Acceptance criteria

- [ ] `TableDefinition` resolves the default PK name via
      `Base.getPrimaryKey(singularize(tableName))`, matching
      `schema_definitions.rb:397`.
- [ ] The two `primary_key_prefix_type` cases above are ported into
      `packages/activerecord/src/migration/change-schema.test.ts` with names
      matching Rails verbatim, and pass.
- [ ] No import cycle introduced into Base initialization.
- [ ] Green on all three lanes.
