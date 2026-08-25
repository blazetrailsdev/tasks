---
title: "createTable reads the table comment from options, Rails reads td.comment"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5808
claim: "2026-08-01T18:03:00Z"
assignee: "create-table-table-comment-read-from-options-not-td"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while reordering the pending-index / comment blocks in `createTable`
(PR #5802).

Rails reads the table comment off the **table definition**, not the raw options
hash:

```ruby
if table_comment = td.comment.presence
  change_table_comment(table_name, table_comment)
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:316-318`)

trails reads `presence(options.comment)` in `SchemaStatements#createTable`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
the `supportsComments && !supportsCommentsInCreate` block).

The two agree when the caller passes `comment:` to `createTable`, but diverge
whenever the table definition's comment is set or normalized by
`buildCreateTableDefinition` / adapter overrides rather than by the literal
option — the definition is the single source of truth in Rails.

The column arm already reads `column.options?.comment` off the definition, so
only the table-level read is out of step.

## Acceptance criteria

- [ ] The table-comment read in `createTable` sources from `td.comment`, per
      `abstract/schema_statements.rb:316-318`.
- [ ] A regression test covers a table whose definition carries a comment that
      is not identical to the raw `options.comment`.
- [ ] `migration/` and the PG comment tests green on all three adapters.
