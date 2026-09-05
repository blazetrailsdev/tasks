---
title: "enumTypeFrom's subtype-inference arm sends .type() where Rails' enum block never does"
status: draft
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7507, which widened `enumTypeFrom`'s `reflected` parameter to
`ValueType | null` as part of the nullable-attribute-type pass and had to spell
the dereference `reflected!`.

Rails' `decorate_attributes` block in `_enum`
(`vendor/rails/activerecord/lib/active_record/enum.rb:240-249`) is three lines
and never sends anything to the reflected subtype:

```ruby
decorate_attributes([name]) do |_name, subtype|
  if subtype == ActiveModel::Type.default_value
    raise "Undeclared attribute type for enum '#{name}' in #{self.name}. ..."
  end

  subtype = subtype.subtype if EnumType === subtype
  EnumType.new(name, enum_values, subtype, raise_on_invalid_values: !validate)
end
```

trails routes that block through a helper Rails does not have,
`enumTypeFrom` (`packages/activerecord/src/enum.ts:43-60`), whose else-branch
adds an inference arm with no Rails counterpart:

```ts
const rv = reflected!;
subtype = rv.type() == null ? subtypeInstance(inferSubtype(Object.values(mapping))) : rv;
```

`rv.type()` is a send Rails never makes on the reflected subtype, and
`subtypeInstance(inferSubtype(...))` invents a subtype from the enum's mapping
values where Rails uses the reflected one unconditionally. The `!` is honest
about a nil raising `NoMethodError` there, but the send itself should not exist.

This is residue from `converge-attribute-seed-to-reflected-type-for-column`
(RFC 0050, PR #4799), whose own acceptance criteria said "`enumTypeFrom` then
mirrors Rails' block verbatim (`subtype = subtype.subtype if EnumType ===
subtype`)". The seed convergence landed; the helper's inference arm did not go
with it.

## Converged shape

Inline `enumTypeFrom` back into the `decorateAttributes` callback in
`installEnumAttribute` so one Rails block is one TS block, and drop the
`rv.type() == null` inference arm along with `inferSubtype` /
`subtypeInstance` if nothing else reads them. The callback then reads:
the `defaultValue()` guard, `subtype = subtype.subtype if EnumType === subtype`,
`new EnumType(...)` — and `reflected` needs no dereference at all, so the `!`
goes with it.

If the inference arm turns out to be load-bearing for an adapter that reflects
no usable column type, that is a seed-path bug to fix at the seed
(`attributes.rb:241-245`'s `type_for_column`), not an arm to keep here.

## Acceptance criteria

- [ ] `enum.ts` has no `enumTypeFrom` helper; the `decorateAttributes` callback
      mirrors `enum.rb:240-249` line for line.
- [ ] No send to the reflected subtype other than the `EnumType === subtype`
      test and `.subtype` read Rails makes; the `reflected!` assertion is gone.
- [ ] `inferSubtype` / `subtypeInstance` deleted if unreferenced, or their
      remaining callers named.
- [ ] `packages/activerecord/src/enum.test.ts` stays green on all five adapter
      lanes, including the schema-reflected, default-only and explicitly-typed
      enum cases PR #4748 added.
- [ ] `pnpm parity:api:extra:gate` activerecord `novel`/`total` do not rise.
