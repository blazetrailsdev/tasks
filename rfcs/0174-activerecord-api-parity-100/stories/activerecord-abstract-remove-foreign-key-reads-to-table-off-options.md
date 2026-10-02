---
title: "abstract remove_foreign_key reads to_table off the options hash before the if_exists guard"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#remove_foreign_key`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1214-1224`):

```ruby
def remove_foreign_key(from_table, to_table = nil, **options)
  return unless use_foreign_keys?
  return if options.delete(:if_exists) == true && !foreign_key_exists?(from_table, to_table)

  fk_name_to_delete = foreign_key_for!(from_table, to_table: to_table, **options).name
```

Called as `remove_foreign_key :accounts, to_table: :owners`, `to_table` is `nil`. So the `if_exists`
guard asks `foreign_key_exists?(from_table, nil)`, and `to_table: to_table, **options` lets the
`:to_table` in `options` win.

The port (`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
`removeForeignKey`) handles the hash-as-second-argument call with an arm Rails does not have:

```ts
if (typeof toTable === "object" && toTable !== null) {
  options = toTable;
  toTable = options.toTable;
}
```

and then builds `{ ...options, toTable }`. The `if_exists` guard therefore receives the options'
`toTable` where Rails passes `nil`, and the merge order is reversed.

The SQLite3 override already has the converged shape
(`packages/activerecord/src/connection-adapters/sqlite3/schema-statements.ts`, `removeForeignKey`):
`options = { ...toTable, ...options }; toTable = undefined;`.

The option-key report does not show this row: `to_table` is also a positional param name, which the
comparer drops on both sides.

## Acceptance criteria

- [ ] The hash-as-second-argument arm leaves `toTable` unset, as the SQLite3 override does, so `foreignKeyExists(fromTable, toTable)` receives what Rails passes.
- [ ] The lookup is `foreignKeyForBang(fromTable, { toTable, ...options })`, the key order of `to_table: to_table, **options`.
- [ ] `migration/foreign-key.test.ts` stays green on all three adapter lanes.

## Verification

```bash
pnpm vitest run packages/activerecord/src/migration/foreign-key.test.ts
```
