---
title: "Table's type-caster delegations cast the null name back to string"
status: draft
updated: 2026-08-26
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7074 (RFC 0124, `type-attribute-name-for-the-nil-table-get-accepts`).

That story widened `Attribute.name` to `string | Node | null` — Rails' `Table#[]`
accepts a nil name and `Relation#delete_all` / `#update_all` build `table[nil]`
for a pkless model (`vendor/rails/activerecord/lib/active_record/relation.rb:1027-1031`,
`:610-614`) — and threaded the null arm through `RelationLike`'s two caster
signatures. It stopped one layer short: `Table`'s own delegations still cast the
widened name straight back to `string`.

`packages/arel/src/table.ts:223-238`:

```ts
typeCastForDatabase(attrName: string | Node | null, value: unknown): unknown {
  return (this.typeCaster as TypeCaster).typeCastForDatabase(attrName as string, value);
}

typeForAttribute(name: string | Node | null): unknown {
  return (this.typeCaster as TypeCaster).typeForAttribute(name as string);
}
```

The `TypeCaster` interface at `table.ts:36-39` is what forces the cast — it
declares both members as taking `string`:

```ts
export interface TypeCaster {
  typeCastForDatabase(attrName: string, value: unknown): unknown;
  typeForAttribute(name: string): unknown;
}
```

Rails types none of this. `Arel::Table#type_cast_for_database` /
`#type_for_attribute` hand `name` to a duck-typed `@type_caster` untouched
(`vendor/rails/activerecord/lib/arel/table.rb:100-107`), and
`ActiveRecord::TypeCaster::Map#type_for_attribute` is
`types.type_for_attribute(attr_name)` with no coercion
(`vendor/rails/activerecord/lib/active_record/type_caster/map.rb:15-21`).

This is the same deviation class as the already-converged
`attribute-type-caster-delegations-cast-name-to-string` (PR #7064), which fixed
the `attribute.ts` half; the `table.ts` half was out of scope there and the null
arm did not exist yet when it landed. The call-site comment at `table.ts:224-227`
argues the cast is safe because "only a String name ever reaches a caster" —
that is a reachability claim, not a type, and the cast is the acceptance signal.

## Converged shape

- Widen `TypeCaster`'s two members to the name type `Table` actually holds
  (`string | Node | null`), matching what Rails passes through untouched.
- Delete both `as string` casts in `table.ts`.
- Walk the implementors — `activerecord/src/type-caster/` (`Map`, `Connection`)
  and any test doubles — and decide each null arm explicitly rather than letting
  it arrive via a cast, exactly as PR #7074 did for the visitor and
  `AbstractAdapter#columnForAttribute` (Rails' `attribute.name.to_s`,
  `abstract_adapter.rb:1173`, makes nil `""`).
- If a caster genuinely cannot accept a nil name, the guard belongs in the
  caster with the Rails behaviour spelled out, not in a cast at the delegation.

## Acceptance criteria

- `TypeCaster` in `packages/arel/src/table.ts` admits the name type `Table`
  holds; neither delegation casts.
- Every `TypeCaster` implementor handles the null arm explicitly.
- Emitted SQL and cast behaviour unchanged for every non-null name.
- `pnpm parity:api:calls` / `:args` clean; `parity:api:extra:gate` green.
