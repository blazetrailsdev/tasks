---
title: "Parameter-name drift: _create_record's mixin layers, and the partial-inserts branch inlined into persistence"
status: ready
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7201 converged the four `_update_record` positional-misalignment rows
(`param-drift-update-record-positional-misalignment`), and PR #7171 converged
`persistence.rb#_create_record`. Two rows of the SAME shape remain in
`output/param-name-mismatches.json` — the mixin layers of the `_create_record`
super chain, which still take `superFn` in the slot Rails gives
`attribute_names`:

```text
attribute_methods/dirty.rb#_create_record @0  attribute_names → superFn
counter_cache.rb#_create_record           @0  attribute_names → superFn
```

Rails:

- `vendor/rails/activerecord/lib/active_record/attribute_methods/dirty.rb:239-243`
  — `def _create_record(attribute_names = attribute_names_for_partial_inserts); id = super; changes_applied; id; end`
- `vendor/rails/activerecord/lib/active_record/counter_cache.rb:200-208`
  — `def _create_record(attribute_names = self.attribute_names); id = super; ...; id; end`

Current TS:

- `packages/activerecord/src/attribute-methods/dirty.ts:194` — `_createRecord(this, superFn)`
- `packages/activerecord/src/counter-cache.ts:204` — `_createRecord(this, superFn)`
- the chain is assembled in `packages/activerecord/src/callbacks.ts:61` —
  `dirtyCreateRecord → counterCacheCreateRecord → persistenceCreateRecord`

## Converged shape

`_createRecord(attributeNames, superFn)` in both mixin files, exactly as PR
#7201 did for `_updateRecord`: `attributeNames ??= <the Rails default for that
layer>` then `superFn(attributeNames)`, with `callbacks.ts` threading the
resolved list down.

The Dirty layer's default is `attributeNamesForPartialInserts`
(`dirty.ts:246`), which `persistence.ts#_createRecord` currently **inlines** —
it re-derives the `partialInserts` / auto-populated-column branch itself
(`packages/activerecord/src/persistence.ts:1093-1105`) where Rails' persistence
body has only `attributes_for_create(attribute_names)`
(`persistence.rb:921`). Threading the parameter is what lets that inlined block
be deleted, so do both in one PR — this is the substance of the story, not the
rename.

## Acceptance criteria

- Both rows above are gone from `output/param-name-mismatches.json`.
- `persistence.ts#_createRecord`'s inlined partial-inserts branch is deleted;
  its body reads as `persistence.rb:920-936` does.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new row.
- AR suite green on all three lanes.
