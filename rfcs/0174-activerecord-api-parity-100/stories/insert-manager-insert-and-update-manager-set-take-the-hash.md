---
title: "arel: InsertManager#insert and UpdateManager#set take the Hash ActiveRecord passes"
status: done
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8743
claim: "2026-10-10T02:39:37Z"
assignee: "load-async-null-executor-load-is-unawaited-and-races-rollback"
blocked-by: null
closed-reason: null
---

## Context

`Arel::InsertManager#insert` (`vendor/rails/v8.0.2/activerecord/lib/arel/insert_manager.rb:21-38`)
and `Arel::UpdateManager#set` (`vendor/rails/v8.0.2/activerecord/lib/arel/update_manager.rb:18-31`)
take whatever answers `each` / `map` with `|column, value|`, and ActiveRecord hands them a Hash:
`im.insert(values.transform_keys { |name| arel_table[name] })` and
`um.set(values.transform_keys { |name| arel_table[name] })`
(`activerecord/lib/active_record/persistence.rb:254,274`).

In trails `InsertManager#insert` (`packages/arel/src/insert-manager.ts`) is typed
`string | [ArelNode, unknown][]` and reads `fields[0][0]` for Rails' `fields.first.first`;
`UpdateManager#set` (`packages/arel/src/update-manager.ts`, `UpdateValues` in `crud.ts`) calls
`values.map` on a pair array. So since trails#8660 `_insertRecord` / `_updateRecord`
(`packages/activerecord/src/persistence.ts`) spread the transformed Hash into pairs at the call
site: `im.insert([...transformKeys(values, (name) => arelTable.get(name))])`.

## Acceptance criteria

- [ ] `insert` and `set` accept the Hash (`Map<ArelNode, unknown>`) as well as pairs, reading it
      as Rails does (`fields.first.first`, `fields.each`, `values.map`).
- [ ] `_insertRecord` / `_updateRecord` pass `transformKeys(...)` with no spread.
- [ ] `mixin-declaration-drift`, `parity:api:params` and the arel manager tests stay green.
