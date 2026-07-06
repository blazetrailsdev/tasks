---
title: "new-foreign-key-definition-converge-prefix-suffix-and-options"
status: ready
updated: 2026-07-06
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`TableDefinition#newForeignKeyDefinition`
(packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:903-920)
does NOT mirror Rails' `new_foreign_key_definition`
(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb).
Rails:

```ruby
def new_foreign_key_definition(to_table, options)
  prefix = ActiveRecord::Base.table_name_prefix
  suffix = ActiveRecord::Base.table_name_suffix
  to_table = "#{prefix}#{to_table}#{suffix}"
  options = @conn.foreign_key_options(name, to_table, options)
  ForeignKeyDefinition.new(name, to_table, options)
end
```

Two deviations in trails:

1. The `to_table` is NOT wrapped with `table_name_prefix`/`table_name_suffix`
   before the FK def is built (trails already exposes
   `stripTableNamePrefixAndSuffix`/adapter prefix+suffix — wire it through here).
2. The default name is the deviating `fk_${tableName}_${col}` and the column
   default uses the bespoke `singularize` branch instead of routing through the
   (now-converged) `foreignKeyOptions`, which supplies the SHA256 `fk_rails_<hex>`.

This was surfaced reviewing PR #3803 (abstract addForeignKey convergence): the
abstract `addForeignKey` builds the `ForeignKeyDefinition` inline via
`foreignKeyOptions` (correct fk_rails name) rather than routing through
`at.addForeignKey(toTable, options) -> td.newForeignKeyDefinition`, because the
latter is itself non-converged and would regress the name and drop prefix/suffix.

## Acceptance criteria

- [ ] `newForeignKeyDefinition` applies `table_name_prefix`/`table_name_suffix`
      to `to_table` before constructing the def, mirroring Rails.
- [ ] It routes the column/name defaults through `foreignKeyOptions` so the
      default name is `fk_rails_<hex>` (not `fk_<table>_<col>`) on every FK path
      (create_table FK column + AlterTable#addForeignKey).
- [ ] Once converged, the abstract `addForeignKey` can route through
      `at.addForeignKey(toTable, options)` instead of building the FK def inline.
- [ ] api:compare and test:compare delta non-negative; no test-name changes.
