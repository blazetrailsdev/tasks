---
title: "parity:fixtures: compare HABTM label lists instead of skipping them"
status: draft
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/fixtures-compare/compare.ts` skips a HABTM / has_many-through label attribute once both rows carry
it (`compareFile`'s `labelAttrs?.has(attr) && attr in tsRow && attr in railsRow` arm over
`HABTM_LABEL_ATTRS`). Since trails#8332 a TS row that drops the label is reported `missing-in-ts`, but the
label **values** are still never compared: `dead_parrots.yml` carries `treasures: [ruby, sapphire]` and a TS
row with `treasures: ["ruby"]` would still MATCH (`attrs: 3/3 (+1 skipped)`).

Rails reads the value as a list of labels, either a YAML array or a comma-separated string
(`activerecord/lib/active_record/fixture_set/table_row.rb`, `add_join_records`:
`targets = targets.is_a?(Array) ? targets : targets.split(/\s*,\s*/)`), so `"diamond, sapphire"` and
`[diamond, sapphire]` are the same set.

`HABTM_LABEL_ATTRS` is also a hand-kept table (`developers.sharedComputers`, `parrots.treasures`) while the
models manifest already records each class's `has_and_belongs_to_many` / `has_many` associations.

## Acceptance criteria

- [ ] A label attribute is compared as the list `add_join_records` builds (array, or string split on
      `/\s*,\s*/`), order-sensitive as Rails inserts them, and counted in `attrsMatched` rather than
      `attrsSkipped`.
- [ ] `HABTM_LABEL_ATTRS` is derived from the manifest's associations for the set's model class, or deleted.
- [ ] `pnpm parity:fixtures` stays at diff 0 with zero label attributes skipped.
