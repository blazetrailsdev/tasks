---
title: "schema_creation: column_options calls merge; retire the PERMANENT @missingRailsCall and the caller casts"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaCreation#column_options` is `o.options.merge(column: o)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_creation.rb:146-148`).
trails spells it as an object spread and carries a receipt for the omitted call
(`packages/activerecord/src/connection-adapters/abstract/schema-creation.ts:311-317`):

```ts
/**
 * @internal
 * @missingRailsCall merge — PERMANENT
 */
protected columnOptions(o: ColumnDefinition): Record<string, unknown> {
  return { ...o.options, column: o };
}
```

`@blazetrails/ruby-compat` exports `merge` (`packages/ruby-compat/src/hash.ts:147`), so the call is portable and
the receipt is not a language shortcoming. The `Record<string, unknown>` return type also forces the
`as ColumnOptions` / `as MysqlColumnOptions` casts at its callers (`abstract/schema-creation.ts:168`,
`mysql/schema-creation.ts:76,85`), now that trails#8333 typed `add_column_options!`'s `:column` key.

## Converged shape

```ts
protected columnOptions(o: ColumnDefinition) {
  return merge(o.options, { column: o });
}
```

## Acceptance criteria

- [ ] `columnOptions` calls `merge` and the `@missingRailsCall merge — PERMANENT` tag is deleted.
- [ ] Its return type carries `column`, and the caller casts that existed only to add it are removed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` pass with no new rows.
