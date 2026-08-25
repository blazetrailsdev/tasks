---
title: "converge-build-arel-limit-offset-cast-value"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6602
claim: "2026-08-16T17:52:42Z"
assignee: "converge-build-arel-limit-offset-cast-value"
blocked-by: null
closed-reason: null
---

## Context

Rails wraps `build_arel`'s LIMIT and OFFSET in `build_cast_value` before
handing them to Arel, and coerces the offset with `to_i`:

```ruby
arel.take(build_cast_value("LIMIT", connection.sanitize_limit(limit_value))) if limit_value
arel.skip(build_cast_value("OFFSET", offset_value.to_i)) if offset_value
```

(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1757-1758`)

```ruby
def build_cast_value(name, value)
  ActiveModel::Attribute.with_cast_value(name, value, Type.default_value)
end
```

(`query_methods.rb:1779-1781`)

The trails port (`packages/activerecord/src/relation/query-methods.ts`,
`buildArel`) passes both values raw:

```ts
if (this._limitValue !== null) arel.take(sanitizeLimit(this._limitValue));
if (this._offsetValue !== null) arel.skip(this._offsetValue);
```

so LIMIT/OFFSET reach the visitor as bare values rather than as
`ActiveModel::Attribute` cast values. `buildCastValue` is **already ported and
exported** from that same file (`query-methods.ts:1772`,
`Attribute.withCastValue(name, value, new ValueType())`) — it is simply not
called from `buildArel`. This is the last unconverged line-level gap in a body
that is otherwise a line-for-line port of `query_methods.rb:1750`.

Surfaced while landing `converge-relation-build-arel-single-builder` (PR #6593),
which retired the second builder; the gap was left alone there to keep that PR
scoped to the builder collapse.

Two sub-parts, both small:

1. Wrap both in `buildCastValue("LIMIT", ...)` / `buildCastValue("OFFSET", ...)`.
2. Restore the `offset_value.to_i` coercion, which has no trails counterpart at
   all right now.

Check the Arel visitor accepts an `Attribute` in the Limit/Offset slot before
flipping — if it does not, that is the real work in this story, and it is the
same shape the bind/collector path already handles elsewhere.

## Acceptance criteria

- `buildArel` calls `buildCastValue` for both LIMIT and OFFSET, matching
  `query_methods.rb:1757-1758` argument-for-argument.
- The offset is integer-coerced, mirroring `offset_value.to_i`.
- Emitted SQL for `limit`/`offset` is unchanged for the existing cases; a test
  covers a non-integer offset value (the arm `to_i` exists for).
- `pnpm parity:api:calls` / `:args` clean — note this should RETIRE, not add,
  call/arg rows for `build_arel`.
- `parity:api` and `parity:test` deltas non-negative.
