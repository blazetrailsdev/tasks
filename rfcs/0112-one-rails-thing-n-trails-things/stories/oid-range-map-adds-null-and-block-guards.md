---
title: "OID::Range#map carries null/block guards Rails does not have"
status: draft
updated: 2026-08-26
rfc: "0112-one-rails-thing-n-trails-things"
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

Rails' `OID::Range#map` has no guards
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/range.rb:50-54`):

```ruby
def map(value) # :nodoc:
  new_begin = yield(value.begin)
  new_end = yield(value.end)
  ::Range.new(new_begin, new_end, value.exclude_end?)
end
```

It takes a required block (`yield` raises `LocalJumpError` without one) and
assumes `value` is a `::Range` (`nil.begin` is a `NoMethodError`).

trails' port adds a guard Rails does not have
(`packages/activerecord/src/connection-adapters/postgresql/oid/range.ts:133-138`):

```ts
override map(value: Range | null, block?: (value: unknown) => unknown): Range | null {
  if (value == null || !block) return value;
  ...
}
```

so a `null` value or an absent block silently passes through where Rails raises.
That turns two programming errors into silent no-ops, and it makes the block
optional in the signature where Rails' is required — which then propagates: the
`map` hook's other implementations (`activemodel/src/type/value.ts:94`,
`.../oid/array.ts:255`) all carry the same optional-block spelling.

Surfaced while reviewing PR #7097, which routed `TimeZoneConverter#serialize`
through this hook. Noted there as pre-existing and out of scope for that story.

## Converged shape

Drop the `value == null || !block` guard and make the block a required
parameter, matching `range.rb:50-54`. Audit the callers of `map` first — the
`null` arm is load-bearing for `TimeZoneConverter._resolveForSerialize`
(`packages/activerecord/src/attribute-methods/time-zone-conversion.ts`), which
relies on `map(null, fn)` returning `null` for a range with a `nil` bound; in
Rails that case never reaches `OID::Range#map` because the block is applied to
the bound, not re-entered on `nil`. If the guard has to survive on the abstract
`Type::Value#map`, it does not belong on the `OID::Range` override.

Coordinate with `time-zone-converter-serialize-rederives-container-walk`, which
may delete that call site entirely.

## Acceptance criteria

- [ ] `RangeType#map` mirrors `range.rb:50-54` with no null/block guard, and its
      block parameter is required.
- [ ] Callers that depended on the guard are fixed at the call site, not by
      restoring it.
- [ ] PG `range` suite and `attribute-methods/time-zone-conversion*` stay green.
