---
title: "Port ModelSchema#inherited's reload_schema_from_cache(false) onto subclass registration"
status: blocked
updated: 2026-09-14
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-14T23:29:33Z"
assignee: "port-model-schema-inherited-non-recursive-reload"
blocked-by: "JS has no hook that runs when a subclass is defined (CLAUDE.md Module mixins: 'Only inherited has no equivalent'). model_schema.rb:574-580 resets the child's memos at definition time; a lazy reset at first schema read (registerSubclass is only reached from registerModel arrays / _defaultAttributes) would clobber memos written to the child before that read (applyColumnsHash, attribute declarations), so the own-property guards cannot be removed. Needs a class-definition hook (e.g. a decorator/registration step every model runs) before this can converge."
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
