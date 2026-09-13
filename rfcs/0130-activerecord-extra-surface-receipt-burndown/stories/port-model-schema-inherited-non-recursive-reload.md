---
title: "Port ModelSchema#inherited's reload_schema_from_cache(false) onto subclass registration"
status: ready
updated: 2026-09-13
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::ModelSchema::ClassMethods#inherited`
(`activerecord/lib/active_record/model_schema.rb:574-580`) calls
`child_class.initialize_load_schema_monitor`, then
`child_class.reload_schema_from_cache(false)`, then nils `@ignored_columns`, so
every new subclass starts with its own empty schema memos and never reads its
parent's through inheritance.

trails#7736 added the `recursive = true` parameter to `reloadSchemaFromCache`
(`packages/activerecord/src/model-schema.ts`) and forwarded it through
`attributes.ts` and `timestamp.ts`, but nothing calls it with `false`. JS has no
hook that runs when a subclass is defined, so trails works around the missing
reset with own-property guards instead (`ownSchemaMemo`, the
`hasOwnProperty` checks in `columnNames` and `attributeNames`).

## Acceptance criteria

- Find the place trails already registers a subclass (`registerSubclass` in
  `inheritance.ts`, or the lazy per-class schema load) and run Rails' `inherited`
  body there: `reloadSchemaFromCache(false)` and the `_ignoredColumns` reset.
- Remove the own-property guards that stand in for that reset where they become
  redundant.
- Add a test that fails without the change.
