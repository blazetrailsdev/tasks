---
title: "abstract visitTableDefinition omits Rails' supports_indexes_in_create? branch"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6100
claim: "2026-08-04T22:59:07Z"
assignee: "i18n-date-numeric-parser-patterns"
blocked-by: null
closed-reason: null
---

## Context

Rails' abstract `SchemaCreation#visit_TableDefinition` emits inline indexes
itself, gated on the adapter flag:

```ruby
if supports_indexes_in_create?
  statements.concat(o.indexes.map { |column_name, options| index_in_create(o.name, column_name, options) })
end
```

(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_creation.rb:52-55,
between the `primary_keys` push and the `use_foreign_keys?` branch.)

trails' `packages/activerecord/src/connection-adapters/abstract/schema-creation.ts`
`visitTableDefinition` has no such branch at all — the columns push is followed
straight by `useForeignKeys()`. It happens to be unobservable today only because
`supportsIndexesInCreate()` is `false` on the abstract adapter, PG and SQLite,
and MySQL carries a full `visitTableDefinition` override that Rails does not
have (see `retire-mysql-visit-table-definition-override`). Any future adapter
that flips the flag silently loses its inline indexes.

## Acceptance criteria

- [ ] `abstract/schema-creation.ts` `visitTableDefinition` carries the
      `supportsIndexesInCreate()` branch in Rails' position, mapping
      `o.indexes` through `indexInCreate(o.tableName, columnName, options)`.
- [ ] `indexInCreate` is declared on the abstract visitor (Rails leaves it
      undefined there and relies on the flag being false; TS needs a
      declaration — a protected member that throws `NotImplementedError` keeps
      the same reachability).
- [ ] The sqlite/PG schema-creation suites stay green (the branch is inert for
      them).
