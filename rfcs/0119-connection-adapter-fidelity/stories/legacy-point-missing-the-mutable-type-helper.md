---
title: "LegacyPoint drops include Helpers::Mutable, so changed_in_place? and mutable? are missing"
status: done
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 90
pr: 7657
claim: "2026-09-09T23:42:02Z"
assignee: "remove-invented-translate-and-enrich-wrapper"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7624 while converging `LegacyPoint#cast` onto
`legacy_point.rb:14-25`.

`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/legacy_point.rb:8`
opens with `include ActiveModel::Type::Helpers::Mutable`, immediately after
`class LegacyPoint < Type::Value`. trails'
`packages/activerecord/src/connection-adapters/postgresql/oid/legacy-point.ts`
has no such include and no equivalent members, so two of the three members that
mixin contributes are simply missing from the port.

`vendor/rails/activemodel/lib/active_model/type/helpers/mutable.rb` is:

```ruby
module Mutable
  def cast(value)
    deserialize(serialize(value))
  end

  def changed_in_place?(raw_old_value, new_value)
    raw_old_value != serialize(new_value)
  end

  def mutable? # :nodoc:
    true
  end
end
```

`Mutable#cast` is shadowed — `LegacyPoint` defines its own `cast`, which wins
over an included module — so only `changed_in_place?` and `mutable?` actually
reach the class. Both are absent in trails, which means a mutated point on a
persisted record is not detected as dirty, and the type does not report itself
as mutable to the attribute layer.

The sibling `point.ts` already carries both halves (`isMutable()`,
`isChangedInPlace()`), so the shape to mirror is settled and in-repo.

## Converged shape

- `LegacyPoint` gains `isMutable()` returning `true` and
  `isChangedInPlace(rawOldValue, newValue)` returning
  `!rbEqual(rawOldValue, this.serialize(newValue))`, the same two bodies
  `point.ts` already has, sourced from `mutable.rb:11-17`.
- Prefer the repo's established mixin idiom over hand-copying the bodies if one
  fits — Ruby's `include ActiveModel::Type::Helpers::Mutable` is an `include()`
  / `Included<>` candidate, and `Mutable`'s `cast` must stay shadowed by
  `LegacyPoint#cast` either way.

## Acceptance criteria

- [ ] `LegacyPoint` answers `isMutable()` and `isChangedInPlace()` per
      `mutable.rb:11-17`, with `LegacyPoint#cast` (`legacy_point.rb:14-25`)
      still winning over `Mutable#cast`.
- [ ] A test pins in-place mutation of a legacy point being detected as dirty.
- [ ] `pnpm parity:api` shows no regression for `legacy_point.rb`.
