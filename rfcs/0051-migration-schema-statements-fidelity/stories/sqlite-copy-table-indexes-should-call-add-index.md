---
title: "copy_table_indexes hand-builds CREATE INDEX instead of calling add_index"
status: done
updated: 2026-08-10
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6315
claim: "2026-08-10T01:16:46Z"
assignee: "date-infinity-has-none-of-numerics-inherited-comparable-surface"
blocked-by: null
closed-reason: null
---

## Context

Rails' `copy_table_indexes` does not build SQL. For each index on the source
table it computes the renamed name and the surviving column list and then calls
the schema statement:

```ruby
options = { name: name.gsub(/(^|_)(#{from})_/, "\\1#{to}_"), internal: true }
options[:unique] = true if index.unique
options[:where]  = index.where if index.where
options[:order]  = index.orders if index.orders
add_index(to, columns, **options)
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:651-677`,
the `add_index` call at `:675`.)

trails' `SQLite3Adapter#copyTableIndexes`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`) assembles
the `CREATE [UNIQUE] INDEX … ON … (…) [WHERE …]` string itself and hands it to
`this.execute(sql)`.

PR #6301 converged the _primitive_ — it used to reach `driver.exec` via a
private `execCopyTable`, and now goes through `execute`, so the statement is
logged and dirties the query cache — but it still does not reach `add_index`.
That omission is carried as a `@missingRailsCall add_index` tag on
`copyTableIndexes`, and the corresponding `call-mismatches-exclude` row was
deleted in favour of the tag, so the tag is now the only register for it.

**Why it was left.** SQLite puts the schema on the INDEX name, not on the table
it indexes — `CREATE INDEX aux.by_name ON widgets (…)` — and qualifying the
table instead is a syntax error. `add_index` has no notion of an ATTACHed
schema, so the qualified-name arm has nowhere to go through it. Rails has no
ATTACHed-schema concept here at all, which is why its `add_index` call is
unconditional.

## Converged shape

Route the unqualified case — which is every case Rails has — through
`this.addIndex(to, columns, { name, internal: true, unique?, where?, order? })`,
mirroring `sqlite3_adapter.rb:668-675` including the `internal: true` flag and
the `**options` splat order. Decide the ATTACHed-schema arm deliberately rather
than by omission: either teach `addIndex` the schema-qualified index name (it
already splits `_splitTableName` elsewhere in this adapter) so the single call
covers both, or keep the local assembly for that arm alone with the
`@missingRailsCall` narrowed to it.

Note that `add_index` runs `add_index_options` / `index_name_for_remove`-style
validation the hand-built string skips, so converging may surface index-name
length or duplicate-name errors the current path silently accepts — that is the
Rails behaviour, not a regression.

## Acceptance criteria

- [ ] `copyTableIndexes` calls `this.addIndex` for the unqualified case, with
      Rails' option set (`name`, `internal: true`, and `unique` / `where` /
      `order` only when present), per `sqlite3_adapter.rb:668-675`.
- [ ] The ATTACHed-schema arm is either covered by the same call or carries a
      `@missingRailsCall` scoped to just that arm.
- [ ] The `@missingRailsCall add_index` tag on `copyTableIndexes` is removed or
      narrowed; no `call-mismatches-exclude` row is added for it.
- [ ] `pnpm parity:api:calls` green; `adapters/sqlite3/copy-table.trails.test.ts`,
      `migration/foreign-key.test.ts` and the sqlite3 lane green, including the
      partial-index `WHERE`, expression-index and column-order cases those
      tests already pin.
