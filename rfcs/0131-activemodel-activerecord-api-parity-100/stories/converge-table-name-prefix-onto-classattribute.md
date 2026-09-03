---
title: "converge-table-name-prefix-onto-classattribute"
status: in-progress
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: 7446
claim: "2026-09-03T15:51:19Z"
assignee: "converge-future-result-event-buffer-instrument"
blocked-by: null
closed-reason: null
---

## Context

`credit-classattribute-generated-accessors` (PR pending) taught the TS
extractor to credit the accessors `classAttribute()` installs, closing 14 of
its 21 declaration-only members. `model_schema.rb`'s six —
`table_name_prefix` / `table_name_suffix` and their `?` / `=` twins
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:37-52`, a
`class_attribute :table_name_prefix, instance_writer: false, default: ""`) —
did not move, and the extractor is not the reason.

Rails declares the pair in `model_schema.rb`. trails hand-writes it on
`Base` instead: `packages/activerecord/src/base.ts:724` holds
`static _tableNamePrefix = ""` and `:807-813` a `static get/set
tableNamePrefix` pair, while `packages/activerecord/src/model-schema.ts:287`
only types `_tableNamePrefix` on `SchemaHost` and reads it at `:361`. So the
member's only declaration in `model-schema.ts` is a bodyless signature and the
row stays at 59/6/6 (91%).

The fix is a fidelity one, not an extractor one: move the pair to
`model-schema.ts` as the `classAttribute.call(base, "tableNamePrefix", {
instanceWriter: false, default: "" })` / `"tableNameSuffix"` calls Rails makes,
the way `attribute-methods/time-zone-conversion.ts:25-36` already does, and
drop the hand-written statics on `Base`. `packages/activerecord/src/
inheritance.ts:175` and the schema-dumper read `_tableNamePrefix` today and
have to follow.

## Acceptance criteria

- `tableNamePrefix` and `tableNameSuffix` are installed by `classAttribute()`
  from `model-schema.ts`, at Rails' visibility and default, with no
  hand-written `static get`/`set` pair left on `Base`.
- activerecord `model_schema.rb` reaches **65/65**; activerecord package total
  does not fall.
- No baseline row, no `@noRailsEquivalent`, no `declare` added.
