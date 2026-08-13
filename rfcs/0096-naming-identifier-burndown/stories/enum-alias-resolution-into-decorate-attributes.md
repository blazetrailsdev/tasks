---
title: "enum-alias-resolution-into-decorate-attributes"
status: done
updated: 2026-08-13
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6480
claim: "2026-08-13T17:15:38Z"
assignee: "enum-alias-resolution-into-decorate-attributes"
blocked-by: null
closed-reason: null
---

## Context

Split out of `naming-burndown-3-ar-structural-residue` (RFC 0096 wave 3), item 2
— PR for that story converged items 1/5/9-partial and left this one, which needs
a real refactor rather than a rename.

`packages/activerecord/src/enum.ts#_enum` resolves `alias_attribute` targets
inline into an `attrName` local (`enum.ts:567-570`) and then keeps the Rails
`name` parameter alongside it, so the three `define_enum_methods` call rows and
the `_enum` rows cannot converge: every downstream call passes `attrName` where
Rails passes `name`.

Rails resolves the alias INSIDE `decorate_attributes`
(`vendor/rails/activerecord/lib/active_record/enum.rb:239-248`, which reaches
`ActiveModel::AttributeMethods#decorate_attributes` →
`attribute_aliases`), not in `_enum`'s body. `_enum` itself only ever handles
`name` (`enum.rb:227`, `enum.rb:230-237`, `enum.rb:249-270`).

## Acceptance criteria

- [ ] The alias resolution moves out of `_enum`'s body into the
      `decorateAttributes` decorator, matching `enum.rb:239-248`.
- [ ] `_enum` passes `name` (Rails' identifier) to `defineEnumMethods`,
      `installEnumAttribute` and the `_enums` registration; the `attrName` local
      is gone.
- [ ] `alias_attribute` + `enum` ordering behaviour is unchanged (the existing
      enum alias tests stay green on all three adapters).
- [ ] No baseline row added or widened; `pnpm parity:api:calls:args` stays green.
