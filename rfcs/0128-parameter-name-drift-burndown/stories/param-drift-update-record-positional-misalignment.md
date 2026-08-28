---
title: "Parameter-name drift: _update_record's dropped attribute_names, the _create_record twin"
status: draft
updated: 2026-08-28
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `_create_record` half of this shape was converged by PR #7171 (story
`param-drift-positional-misalignment-is-a-dropped-parameter`); its `_update_record`
twin was left untouched and still reports the same **positional misalignment**,
not a rename — so renaming the parameter would bury it.

Rails: `def _update_record(attribute_names = self.attribute_names)`
(`vendor/rails/activerecord/lib/active_record/persistence.rb:899`), with the
block implicit — `create_or_update` calls `_update_record(&block)`
(`persistence.rb:892`) and the body ends `yield(self) if block_given?`.

Four rows, one cause — the port takes the block FIRST and has no
`attributeNames` slot at all:

```text
persistence.rb#_update_record            @0  attribute_names → block
base.rb#_update_record                   @0  attribute_names → block
attribute_methods.rb#_update_record      @0  attribute_names → block
attribute_methods/dirty.rb#_update_record @0 attribute_names → superFn
```

Current TS:

- `packages/activerecord/src/callbacks.ts` — `_updateRecord(this, block?)`
- `packages/activerecord/src/base.ts` — the `_updateRecord(block?)` declaration
  and the prototype link that threads `LockingOptimistic`/`Timestamp`
- `packages/activerecord/src/attribute-methods/dirty.ts` — `_updateRecord(this, superFn)`

Note `persistence.ts:307`'s `_updateRecord(values, constraints)` is the CLASS-level
`_update_record` (`persistence.rb:224`) and is already correct — the misaligned
one is the instance method.

## Converged shape

`_updateRecord(attributeNames?: string[], block?: (record) => void)` through the
whole super chain, mirroring what #7171 did for `_createRecord`: block last, as
Ruby has it, with `create_or_update`'s call site passing `undefined` for the
attribute names. Rails' default is `self.attribute_names`, narrowed by
`Dirty#_update_record`'s `attribute_names_for_partial_updates`
(`attribute_methods/dirty.rb:233-237`).

## Acceptance criteria

- The four rows above are gone from `output/param-name-mismatches.json`.
- Every caller of the changed signature is updated; `pnpm parity:api`,
  `parity:api:calls`, `parity:api:calls:args` and `parity:api:params` show no new row.
- AR suite green on all three lanes.
