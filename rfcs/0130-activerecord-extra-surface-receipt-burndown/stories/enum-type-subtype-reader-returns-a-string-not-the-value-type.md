---
title: "enum-type-subtype-reader-returns-a-string-not-the-value-type"
status: done
updated: 2026-09-11
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: trails#7714
claim: "2026-09-11T18:50:22Z"
assignee: "converge-loader-query-eql-and-hash-onto-rails"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::Enum::EnumType` exposes the wrapped type object directly:

```ruby
attr_reader :subtype
```

(`vendor/rails/activerecord/lib/active_record/enum.rb:210`), and `#type` is
`subtype.type`.

trails' `EnumType` (`packages/activerecord/src/enum.ts:111-121`) diverges on
both halves:

```ts
get subtype(): string | undefined {
  return this._subtypeType.type();
}

override type(): string | undefined {
  return this.subtype;
}

subtypeType(): ValueType<unknown> {
  return this._subtypeType;
}
```

`subtype` returns the subtype's _type name string_ where Rails returns the
`ValueType` object, and `subtypeType()` is an invented accessor with no Ruby
counterpart that exists only to reach the value `subtype` should have been
returning. `type()` then compensates by reading the already-flattened string
instead of Rails' `subtype.type`.

Surfaced by the review of PR #7620, which inlined `enumTypeFrom` back into
`_enum`'s `decorate_attributes` block (`enum.rb:240-249`) and had to spell
Rails' `subtype = subtype.subtype` as `subtype = subtype.subtypeType()`
precisely because of this.

## Converged shape

`get subtype(): ValueType<unknown>` returns `this._subtypeType`, mirroring
`attr_reader :subtype`; `type()` becomes `this.subtype.type()`, mirroring
`enum.rb`'s `def type; subtype.type; end`; `subtypeType()` is deleted and its
call sites read `.subtype`.

## Acceptance criteria

- [ ] `EnumType#subtype` returns the wrapped `ValueType`, not a string.
- [ ] `EnumType#type()` reads `this.subtype.type()`.
- [ ] `subtypeType()` is deleted and every caller (`installEnumAttribute`'s
      `decorateAttributes` callback in `enum.ts`, plus any others found by
      grep) reads `.subtype`.
- [ ] `pnpm parity:api:extra:gate` activerecord `novel`/`total` fall by the
      deleted member and do not rise.
- [ ] `packages/activerecord/src/enum.test.ts` green on all five adapter lanes.
