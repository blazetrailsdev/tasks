---
title: "TableDefinition._adapter type forces unknown-casts for connection readers"
status: done
updated: 2026-08-04
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6094
claim: "2026-08-04T21:35:01Z"
assignee: "model-name-human-takes-options"
blocked-by: null
closed-reason: null
---

## Context

`TableDefinition#valid_column_definition_options`
(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:589-591)
is `@conn.valid_column_definition_options`. PR #6086 ported that delegation, but
`TableDefinition._adapter` is typed `SchemaQuoter`
(connection-adapters/abstract/assert-schema-adapter.ts:9-12), a
`Pick<Quoting, ...>` that does not carry the reader
(abstract/schema_statements.rb:1584-1586), so the body casts:

```ts
const conn = this._adapter as unknown as { validColumnDefinitionOptions(): string[] };
```

The reader exists at runtime on every real adapter — `SchemaStatements` is mixed
in — but not in the static type, so the cast is a typing gap, not a behavioural
one. The same file already casts `_adapter` twice more for the same reason
(`_foreignKeyOptions`, `newCheckConstraintDefinition`, schema-definitions.ts).

## Acceptance criteria

- [ ] `_adapter`'s declared type carries the connection methods TableDefinition
      actually calls, so the `as unknown as` casts in
      `validColumnDefinitionOptions` / `_foreignKeyOptions` /
      `newCheckConstraintDefinition` are deleted.
- [ ] No fallback list or fallback derivation is re-introduced: Rails delegates
      unconditionally to `@conn`.
- [ ] Test stubs that stand in for the connection expose the same surface.
