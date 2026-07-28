---
title: "delegate-add-reference-to-reference-definition"
status: claimed
updated: 2026-07-28
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-28T02:28:17Z"
assignee: "delegate-add-reference-to-reference-definition"
blocked-by: null
closed-reason: null
---

## Context

Rails' `add_reference` (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1063-1065`)
is a one-line delegate:

```ruby
def add_reference(table_name, ref_name, **options)
  ReferenceDefinition.new(ref_name, **options).add(table_name, self)
end
```

It reuses the _same_ `ReferenceDefinition` class that `TableDefinition#references`
uses, so `t.references` inside `create_table`, `t.references` inside
`change_table`, and top-level `add_reference` all share one implementation of
`index_options` / `foreign_key_options` / `foreign_table_name`.

Trails has two independent implementations:

- `ReferenceDefinition` — `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:670+`,
  with `addTo(table)`, used by `t.references` in `createTable`.
- A hand-rolled duplicate in `SchemaStatements#addReference` —
  `packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:699-741`,
  used by top-level `addReference` and by `Table#references` in `changeTable`.

The duplication has already caused one divergence: PR #5482 had to patch the
`addReference` copy so an `index:` options hash is merged rather than dropped
(`ReferenceDefinition#index_options`, `schema_definitions.rb:266-274`) — a fix
`ReferenceDefinition` already had.

A second divergence is still present but dormant: the `addReference` copy does
not merge `conditionalOptions` (`ifExists` / `ifNotExists`) into its index or
foreign-key options the way `ReferenceDefinition#index_options` /
`#foreign_key_options` do (`schema_definitions.rb:267, 276-277`). It is not a
live bug today only because `Table#references` calls `raiseOnIfExistOptions`
before delegating, but the two paths can silently drift again on the next
fidelity fix.

## Acceptance criteria

- [ ] `ReferenceDefinition` gains an `add(tableName, connection)` counterpart to
      its existing `addTo(table)`, mirroring `ReferenceDefinition#add`
      (`schema_definitions.rb:220-228`).
- [ ] `SchemaStatements#addReference` becomes a delegate to
      `new ReferenceDefinition(refName, options).add(tableName, this)`, mirroring
      `schema_statements.rb:1063-1065`, with the hand-rolled column / index /
      foreign-key logic deleted.
- [ ] `conditionalOptions` (`ifExists` / `ifNotExists`) reach index and
      foreign-key options on the `addReference` path, since it now shares
      `ReferenceDefinition`'s option builders.
- [ ] `api:compare --package activerecord` and
      `test:compare --package activerecord` deltas are non-negative;
      `test:compare --gates --check` exits 0.
- [ ] Existing suites stay green: `migration/references-foreign-key.test.ts`,
      `migration/references-statements.test.ts`,
      `migration/references-index.test.ts`, `migration/change-table.test.ts`,
      `migration/foreign-key.test.ts`.
