---
title: "ForeignKeyDefinition.isDefinedFor ignores on_delete/primary_key option keys vs Rails defined_for?"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3804
claim: "2026-06-21T16:46:41Z"
assignee: "foreign-key-defined-for-generic-option-matching"
blocked-by: null
---

## Context

Surfaced during PR #3797 (pg-foreign-key-exists-converge-to-abstract). The TS
`ForeignKeyDefinition.isDefinedFor`
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:157`)
explicitly matches only `toTable`/`column`/`name`/`validate`.

Rails `ForeignKeyDefinition#defined_for?`
(`activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:161`)
matches `to_table`/`validate` explicitly and then **generically** compares all
remaining stored option keys (`primary_key`, `on_delete`, `on_update`, …) via
`options.all? { |k, v| ... self.options[k].to_s == v.to_s }`.

The TS version stores those as typed fields rather than an `options` hash, and
`foreignKeyFor`'s signature only accepts `{ toTable, column, name }` — the keys
`foreign_key_exists?` actually passes — so an `on_delete:`/`primary_key:`-qualified
lookup is silently ignored. Not exercised by `foreign_key_exists?`'s documented
forms today (low priority), but a behavioral deviation worth converging.

## Acceptance criteria

- [ ] Widen `foreignKeyFor` (and the `foreignKeyExists` options surface) to
      accept the remaining FK option keys Rails supports
      (`primaryKey`/`onDelete`/`onUpdate`/`deferrable`).
- [ ] Extend `isDefinedFor` to compare those keys with Rails `to_s` coercion
      semantics, mirroring `defined_for?`'s generic `options.all?`.
- [ ] No test-name changes; verify on all three adapters.
