---
title: "PG Array#changed_in_place? JSON-round-trips instead of comparing elementwise"
status: ready
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `binary-attribute-changed-uses-reference-equality` (PR #7469),
which made `ActiveModel::Type::Value#changed?` Ruby value equality via `rbEqual`
and reduced `Type::Binary#changed_in_place?` to its Rails body.

The PG array type still hand-rolls its comparison.
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/array.rb:71-73`:

```ruby
def changed_in_place?(raw_old_value, new_value)
  deserialize(raw_old_value) != new_value
end
```

trails (`packages/activerecord/src/connection-adapters/postgresql/oid/array.ts:227-230`):

```ts
override isChangedInPlace(rawOldValue: unknown, newValue: unknown): boolean {
  const oldValue = this.deserialize(rawOldValue);
  return stableStringify(oldValue) !== stableStringify(newValue);
}
```

`stableStringify` predates `rbEqual`'s Array arm and is a JSON round-trip
standing in for Ruby `Array#==` (`vendor/ruby/array.c:5120` `rb_ary_equal`). It
is not the same relation: it collapses values JSON cannot distinguish (a Date and
its ISO string, `undefined` and a missing element) and orders object keys, where
Ruby compares elementwise with `==`.

`rbEqual` now compares arrays elementwise, so the Rails body ports directly —
this is the same convergence #7469 already made in `type/binary.ts`.

## Converged shape

```ts
override isChangedInPlace(rawOldValue: unknown, newValue: unknown): boolean {
  const oldValue = this.deserialize(rawOldValue);
  return !rbEqual(oldValue, newValue);
}
```

## Acceptance criteria

- [ ] `Array#isChangedInPlace` is `array.rb:71-73` verbatim, with no
      `stableStringify`.
- [ ] `stableStringify` is deleted if this was its last caller, else left alone.
- [ ] `packages/activerecord/src/adapters/postgresql/array.test.ts` and
      `connection-adapters/postgresql/oid/array*.test.ts` pass against a real
      PostgreSQL, including the in-place mutation cases.
- [ ] parity:api / parity:test delta non-negative; no new call-argument row.
