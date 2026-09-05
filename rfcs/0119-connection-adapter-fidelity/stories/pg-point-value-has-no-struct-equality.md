---
title: "PG PointValue lacks Struct#==, so an equal point always reports changed"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
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

Surfaced converging `binary-attribute-changed-uses-reference-equality` (PR #7469),
which made `ActiveModel::Type::Value#changed?` (`value.rb:84-86`) Ruby value
equality through `rbEqual`.

`ActiveRecord::Point` is a Struct
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/point.rb:4`):

```ruby
Point = Struct.new(:x, :y)
```

so Ruby's `Struct#==` (`vendor/ruby/struct.c` `rb_struct_equal`) compares members,
and `PG::OID::Point` inherits `Value#changed?`'s `old_value != new_value` — two
points with the same x and y are NOT a change.

trails' `PointValue`
(`packages/activerecord/src/connection-adapters/postgresql/oid/point.ts:4-12`) is
a plain class with no `==`. `rbEqual` finds no `equals`/`eql`, is not an Array,
Date, Uint8Array or plain object, and falls through to `false`, so every
reassignment of an equal point still reports changed and re-writes the column —
the same false positive #7469 fixed for binary, in the one remaining
object-valued type that has no value equality.

`Range` (`packages/ruby-compat/src/range.ts:203`) already carries `equals`, and
Json/Jsonb cast to plain objects, which `rbEqual` handles — Point is the gap.

## Converged shape

`PointValue` grows Ruby `Struct#==` under the repo's Ruby-to-TS spelling
(`equals`), member-wise over `x` and `y`, which `rbEqual`'s existing `equals`
arm then picks up with no change to `rb-equal.ts`.

Check `Point#changed_in_place?` at the same time: trails has
`rawOldValue !== this.serialize(newValue)` where `Helpers::Mutable`
(`vendor/rails/activemodel/lib/active_model/type/helpers/mutable.rb:14-16`) is
`raw_old_value != serialize(new_value)` — Ruby value equality again.

## Acceptance criteria

- [ ] Assigning a member-equal `PointValue` reports `changed === false`, matching
      `Struct#==`; a differing x or y still reports `true`.
- [ ] Saving after a member-equal assignment issues no write for that column.
- [ ] `Point#isChangedInPlace` uses the same value equality as
      `mutable.rb:14-16`.
- [ ] parity:api / parity:test delta non-negative.
