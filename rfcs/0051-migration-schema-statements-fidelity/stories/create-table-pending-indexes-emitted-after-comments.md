---
title: "createTable emits pending indexes after the comment block, Rails emits them before"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5802
claim: "2026-08-01T17:33:14Z"
assignee: "create-table-pending-indexes-emitted-after-comments"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while re-inlining `_addPendingIndexes` back into `createTable`
(PR #5797).

Rails' `create_table` emits the definition's pending indexes **before** the
table/column comment block:

```ruby
result = execute schema_creation.accept(td)

unless supports_indexes_in_create?
  td.indexes.each do |column_name, index_options|
    add_index(table_name, column_name, **index_options, if_not_exists: td.if_not_exists)
  end
end

if supports_comments? && !supports_comments_in_create?
  ...
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:308-320`)

trails runs the two in the opposite order — the comment block first, then the
pending-index loop — in `SchemaStatements#createTable`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`).

This is observable as statement ordering: on an adapter that supports comments
but not indexes-in-create, `create_table` emits `COMMENT ON ...` before
`CREATE INDEX` in Rails' order and after it in ours, so `assertQueries`-style
sequence assertions and any log-order comparison diverge. It is not known to
change the resulting schema.

The ordering predates PR #5797, which left it in place deliberately to keep
that PR scoped to the SQLite `alter_table` convergence.

Also note Rails threads `if_not_exists: td.if_not_exists` into each `add_index`
from the table definition; trails passes the per-index `idx.ifNotExists`
instead. Worth confirming those agree, or converging, in the same pass.

## Acceptance criteria

- [ ] `createTable` emits the pending-index loop before the comment block, per
      `abstract/schema_statements.rb:308-320`.
- [ ] The `if_not_exists` source for the pending `addIndex` calls matches
      Rails (`td.ifNotExists`), or the divergence is justified at the call
      site.
- [ ] `migration/`, `schema-dumper.test.ts` and the PG comment tests green on
      all three adapters.
