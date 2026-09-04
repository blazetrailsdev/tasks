---
title: "Mutable#changed_in_place? re-serializes raw_old_value, masking a PG jsonb pre-parse upstream"
status: in-progress
updated: 2026-09-04
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages:
  - "activemodel"
deps: []
deps-rfc: []
est-loc: 90
priority: 63
pr: 7478
claim: "2026-09-04T12:01:52Z"
assignee: "mutable-changed-in-place-reserializes-raw-old-value"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Type::Helpers::Mutable#changed_in_place?` compares the raw
`_before_type_cast` value against the serialized new value — one `serialize`
call. trails adds a second, conditional `serialize` of the OLD value.

Rails (`activemodel/lib/active_model/type/helpers/mutable.rb:11-16`):

```ruby
# +raw_old_value+ will be the `_before_type_cast` version of the
# value (likely a string). +new_value+ will be the current, type
# cast value.
def changed_in_place?(raw_old_value, new_value)
  raw_old_value != serialize(new_value)
end
```

trails today (`packages/activemodel/src/type/helpers/mutable.ts:26-34`):

```ts
isChangedInPlace(this: Type, rawOldValue: unknown, newValue: unknown): boolean {
  const normalizedOld =
    rawOldValue == null || typeof rawOldValue === "string"
      ? rawOldValue
      : this.serialize(rawOldValue);
  return normalizedOld !== this.serialize(newValue);
}
```

The comment there says the slow path exists because "the pg driver parses jsonb
before we see it", i.e. the real defect is UPSTREAM: `rawOldValue` is supposed to
be the `_before_type_cast` string, and on the PG path it is not. Normalizing it
here is a symptom fix at the wrong layer, and it costs a `serialize` call Rails
does not make (flagged by the RFC 0095 call-argument report as a `naming` row on
`type/helpers/mutable.ts`). Surfaced by the RFC 0096 activemodel naming burndown
(PR #6350); deliberately NOT renamed there.

## Converged shape

Fix the PG path so `rawOldValue` reaches `isChangedInPlace` as the
`_before_type_cast` value Rails' contract promises, then reduce the body to
Rails' single comparison:

```ts
isChangedInPlace(this: Type, rawOldValue: unknown, newValue: unknown): boolean {
  return rawOldValue !== this.serialize(newValue);
}
```

Note Ruby's `!=` on the raw value is value equality where JS `!==` is identity;
confirm the surviving comparison is correct for every type that includes
`Mutable` before landing.

## Acceptance criteria

1. `isChangedInPlace` makes exactly the one `serialize` call Rails makes.
2. The PG jsonb case that motivated the slow path is covered by a test that
   FAILS on baseline once the normalization is removed without the upstream fix.
3. The `naming` row for `type/helpers/mutable.ts` in
   `pnpm parity:api:calls:args:report` is gone; report before/after.
4. Dirty-tracking suites stay green on all three adapter lanes — this path is
   PG-specific, so a green SQLite run proves nothing.
