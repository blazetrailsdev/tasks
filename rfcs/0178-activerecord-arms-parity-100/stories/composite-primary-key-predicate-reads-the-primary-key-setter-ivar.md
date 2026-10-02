---
title: "composite_primary_key? reads @composite_primary_key, written by primary_key="
status: draft
updated: 2026-10-01
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `activerecord-converge-missing-control-flow-arms-subsystems`
(`pnpm parity:api:arms:report --package=activerecord --direction=missing` row
`attribute-methods/primary-key.ts#isCompositePrimaryKey  -if`).

Rails' `composite_primary_key?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/primary_key.rb:85-88`)
resets an unset key and then reads an ivar that only `primary_key=` writes
(`:130-140`, `@composite_primary_key = value.is_a?(Array)`; `inherited` seeds it
`false`, `:143-150`):

```ruby
def composite_primary_key? # :nodoc:
  reset_primary_key if PRIMARY_KEY_NOT_SET.equal?(@primary_key)
  @composite_primary_key
end
```

trails' `isCompositePrimaryKey`
(`packages/activerecord/src/attribute-methods/primary-key.ts:193-195`) has no
such ivar. It answers `Array.isArray(getPrimaryKeyAttr.call(this))`, so the
`reset_primary_key if …` arm is not in the body, and `setPrimaryKeyAttr`
(`primary-key.ts:189-191`) writes only `_primaryKey`: it drops
`primary_key=`'s `include CompositePrimaryKey`, the `-v.to_s` / `.freeze`
normalisation, `@composite_primary_key` and `@attributes_builder = nil`.

The ivar cannot simply be added, because about 50 call sites write the memo
behind the setter's back: `static _primaryKey = "x"` / `this._primaryKey = [...]`
in `packages/activerecord/src/test-helpers/models/` (cpk.ts, pet.ts, cart.ts,
auto-id.ts, dashboard.ts, the dl-keyed-_ models, …) and ~30 more in test files
(`grep -rn "\_primaryKey = \|static \_primaryKey" packages --include=_.ts`). A
model set that way would answer `composite_primary_key?` from a stale ivar.

Sibling of `latch-primary-key-resolution-into-reset-primary-key-memo`, which
owns the `primary_key` reader's cold-cache latch; the cold-cache rule there
(a read before the schema cache is warm must not latch `"id"`) applies to this
reader's reset arm too.

## Acceptance criteria

- [ ] `setPrimaryKeyAttr` ports `primary_key=` (`primary_key.rb:130-140`): both
      arms, `@composite_primary_key`, `@attributes_builder = nil`.
- [ ] `isCompositePrimaryKey` is `reset_primary_key if PRIMARY_KEY_NOT_SET…`
      followed by a read of the ivar, with no `Array.isArray` on the key.
- [ ] No model or test writes `_primaryKey` directly; each goes through
      `primaryKey =`, as Rails' `self.primary_key = …` does.
- [ ] The `isCompositePrimaryKey` row leaves the missing-direction arms report.
