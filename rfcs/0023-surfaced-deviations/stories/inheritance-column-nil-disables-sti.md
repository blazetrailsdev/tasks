---
title: "inheritance_column = nil should disable STI (Rails parity)"
status: in-progress
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3358
claim: "2026-06-15T14:53:11Z"
assignee: "inheritance-column-nil-disables-sti"
blocked-by: null
---

## Context

Surfaced by `inheritance-column-default-type-and-has-attribute-gate` (PR #3302).
Rails lets a model **disable STI** by setting `inheritance_column = nil` — see
`class_attribute :inheritance_column, ... default: "type"` plus the
`real_inheritance_column=` alias in
`vendor/rails/activerecord/lib/active_record/model_schema.rb:172-176`. A model
whose table has a `type` column used for non-inheritance data sets it to nil so
`using_single_table_inheritance?` / `find_sti_class` never fire.

trails cannot express this. The setter
(`packages/activerecord/src/model-schema.ts:1139`) coerces
`value ?? undefined`, and the getter returns `this._inheritanceColumn ?? "type"`,
so `Model.inheritanceColumn = null` reads back as `"type"`. After #3302 the
`new`-path STI dispatch gates on `classHasAttribute(inheritanceColumn)`, so a model
with a real `type` column used for non-STI purposes would wrongly attempt STI
dispatch and has **no way to opt out** (the existing `OmgPost.inheritanceColumn =
"disabled"` test only works by pointing at a non-existent column name, not nil).

## Acceptance criteria

- [ ] An explicit `inheritanceColumn = null` is distinguishable from "unset", so
      the getter returns `null` (or a disabled sentinel) and all STI gates
      (`usingSingleTableInheritance`, `subclassFromAttributesForNew`,
      `classHasAttribute`-gated dispatch, `ensureProperType`, `typeCondition`)
      treat the model as non-STI.
- [ ] Unset still defaults to `"type"` (Rails parity, preserved from #3302).
- [ ] A test mirroring Rails: a model with a `type` column and
      `inheritance_column = nil` does not dispatch STI on `new`/`find`.
