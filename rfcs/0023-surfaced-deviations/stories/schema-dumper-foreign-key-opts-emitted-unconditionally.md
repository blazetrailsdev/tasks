---
title: "Dumper emits FK column:/primaryKey: unconditionally; Rails gates both"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/schema-dumper.ts:1099-1100` emits the foreign-key
options on bare truthiness:

```ts
if (fk.column) opts.push(`column: ${JSON.stringify(fk.column)}`);
if (fk.primaryKey) opts.push(`primaryKey: ${JSON.stringify(fk.primaryKey)}`);
```

Rails gates both (`schema_dumper.rb:324-330`):

```ruby
if foreign_key.column != @connection.foreign_key_column_for(foreign_key.to_table, "id")
  parts << "column: #{foreign_key.column.inspect}"
end

if foreign_key.custom_primary_key?
  parts << "primary_key: #{foreign_key.primary_key.inspect}"
end
```

So an ordinary FK (`column: "rocket_id"`, `primaryKey: "id"`) dumps in trails as
`ctx.addForeignKey("astronauts", "rockets", { column: "rocket_id", primaryKey: "id" })`
where Rails emits the bare `add_foreign_key "astronauts", "rockets"`. Found while
porting `CompositeForeignKeyTest` (#5478) — the composite case passes because
both parts genuinely ARE custom there, so no current test covers the scalar case.

`ForeignKeyDefinition#custom_primary_key?` is
`options[:primary_key] != default_primary_key` (`schema_definitions.rb`); check
whether the trails `ForeignKeyDefinition` already carries the equivalent before
recomputing it in the dumper.

## Acceptance criteria

- [ ] `column:` is emitted only when it differs from
      `foreignKeyColumnFor(toTable, "id")`.
- [ ] `primaryKey:` is emitted only for a custom primary key.
- [ ] A scalar-FK dump test covers the omission; the composite case in
      `migration/foreign-key.test.ts` ("schema dumping") still passes unchanged.
- [ ] `schema-dumper.test.ts` and `schema:compare` stay green on all 3 adapters.
