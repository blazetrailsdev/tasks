---
title: "valid-column-definition-options-duplicated-on-table-definition"
status: done
updated: 2026-08-04
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6086
claim: "2026-08-04T19:56:49Z"
assignee: "i18n-async-reload-chain"
blocked-by: null
closed-reason: null
---

## Context

Rails' `TableDefinition#valid_column_definition_options`
(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:589-591)
delegates to the connection:

```ruby
def valid_column_definition_options
  @conn.valid_column_definition_options
end
```

and the adapter's reader (abstract/schema_statements.rb:1584-1586) answers
`ColumnDefinition::OPTION_NAMES` (schema_definitions.rb:79-90).

trails' base `TableDefinition#validColumnDefinitionOptions`
(packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:1123-1136)
instead inlines a second copy of the list, so the same names are maintained in
two places — here and `SchemaStatements#validColumnDefinitionOptions`
(abstract/schema-statements.ts:1981). The per-adapter subclass overrides
(sqlite3/schema-definitions.ts:63, mysql/schema-definitions.ts:261,
postgresql/schema-definitions.ts:279) do match their Rails counterparts.

The duplication became load-bearing in PR #6079, which wired the
`assert_valid_keys` guard in `createColumnDefinition` — the guard now reads
the TableDefinition-local copy rather than the adapter's.

Blocker to check first: `TableDefinition` holds `_adapter: SchemaQuoter`
(abstract/assert-schema-adapter.ts:9-12), a three-method `Pick<Quoting, ...>`
that does not expose `validColumnDefinitionOptions`. Delegating means widening
that surface (and the test stubs built on it), which is why #6079 left it
alone.

## Acceptance criteria

- [ ] Base `TableDefinition#validColumnDefinitionOptions` delegates to the
      connection rather than carrying its own list, matching
      schema_definitions.rb:589-591.
- [ ] The inlined duplicate list is deleted; `ColumnDefinition::OPTION_NAMES`
      has exactly one home in the port.
- [ ] Adapter subclass overrides keep their `super + [...]` shape.
