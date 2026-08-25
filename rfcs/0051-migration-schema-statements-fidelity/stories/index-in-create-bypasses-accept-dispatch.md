---
title: "index_in_create calls visitIndexDefinition directly instead of accept"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6100
claim: "2026-08-04T22:59:07Z"
assignee: "i18n-date-numeric-parser-patterns"
blocked-by: null
closed-reason: null
---

## Context

Rails' `index_in_create` renders the index through the visitor's dispatcher:

```ruby
def index_in_create(table_name, column_name, options)
  index, _ = @conn.add_index_options(table_name, column_name, **options)
  accept(index)
end
```

(vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_creation.rb:98-101.)

trails calls `this.visitIndexDefinition(index, false)` directly in
`packages/activerecord/src/connection-adapters/mysql/schema-creation.ts`, so
`accept`'s dispatch is bypassed. The wide call-parity baseline row
`activerecord mysql/schema-creation.ts index_in_create accept` records exactly
this omission. The blocker is that `accept` in
`abstract/schema-creation.ts` has no `IndexDefinition` branch (only
`CreateIndexDefinition`), and `visitIndexDefinition`'s `create` flag has no
Rails counterpart — Rails' `visit_IndexDefinition` renders the inline form and
`visit_CreateIndexDefinition` prepends `CREATE`.

## Acceptance criteria

- [ ] `accept` dispatches `IndexDefinition` to `visitIndexDefinition`, and
      `indexInCreate` calls `accept(index)`.
- [ ] `visitIndexDefinition` loses the trails-only `create` parameter; the
      `CREATE INDEX` prefix comes from `visitCreateIndexDefinition`, as in
      Rails (abstract/schema_creation.rb `visit_CreateIndexDefinition`).
- [ ] The `index_in_create` / `accept` row is deleted from
      `scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/mysql/schema-creation.json`
      (only-shrink: delete the row by hand, do not reseed).
