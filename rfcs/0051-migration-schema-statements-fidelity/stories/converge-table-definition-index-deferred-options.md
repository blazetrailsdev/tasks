---
title: "converge-table-definition-index-deferred-options"
status: done
updated: 2026-08-04
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6095
claim: "2026-08-04T21:47:01Z"
assignee: "converge-table-definition-index-deferred-options"
blocked-by: null
closed-reason: null
---

## Context

Rails' `TableDefinition#index` stores the caller's options untouched —
`indexes << [column_name, options]`
(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb)
— and the options are validated and normalized later, once, in
`SchemaStatements#add_index_options`
(abstract/schema_statements.rb:1476-1501).

trails' `TableDefinition#index`
(packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts)
instead builds the `IndexDefinition` eagerly, hand-copying each known option
key. Any key it does not know is silently dropped, which is why the
`assert_valid_keys` from `add_index_options` had to be duplicated inline there
(added by the `port-remaining-invalid-options-tests` PR, so
`test_add_column_with_invalid_options`' `index: { nema: "test" }` arm raises).

The duplicated key list is debt: two copies of Rails' one list, in
`schema-definitions.ts#index` and `schema-statements.ts#addIndexOptions`.

## Acceptance criteria

- [ ] `TableDefinition#index` stores the raw `[columns, options]` pair as Rails
      does, with the `IndexDefinition` built downstream (`addIndexOptions` /
      the schema creation visitor for adapters that inline indexes in CREATE).
- [ ] The `assert_valid_keys` list exists once, at Rails' call site.
- [ ] `migration/invalid-options.test.ts` and the schema-dumper suites stay
      green on all three lanes.
