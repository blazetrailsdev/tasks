---
title: "integer attribute type should cast BigInt to Number so FK=PK comparisons work without Number() wrapping on PG"
status: in-progress
updated: 2026-07-04
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4530
claim: "2026-07-04T01:19:43Z"
assignee: "integer-type-bigint-fk-pk-coercion-pg"
blocked-by: null
---

## Context

During autosave-association canonical conversion (PR #4231), 31 `expect(child.fk).toBe(parent.id)` assertions across `autosave-association.test.ts` had to be wrapped with `Number()` on both sides to pass on the PG CI runner.

Root cause: when autosave assigns a parent's `id` (returned as BigInt by `pg` on PG) to a child FK column declared as `attribute(..., "integer")`, the attribute system stores the BigInt as-is rather than casting through the integer type. The parent's `.id` accessor also returns BigInt. So `child.fk` (BigInt stored in attribute cache) and `parent.id` (BigInt from DB round-trip) should both be BigInt — but the attribute cache coerces on read for some paths and not others, producing Number vs BigInt mismatches under parallel CI workers.

In Rails, all Ruby integers are the same type — this mismatch cannot arise. The trails integer type handler should cast assigned values through `castValue` (which normalizes to Number) so that FK columns always hold Number, and the `id` accessor should do the same.

Rails source: `activerecord/lib/active_record/attribute_methods/primary_key.rb` — `id` goes through the column type's `cast`. `activerecord/lib/active_model/type/integer.rb` — `cast_value` converts via `.to_i`.

## Acceptance criteria

- `attribute(..., "integer")` columns cast assigned BigInt values to Number on write (or normalize consistently so `===` works cross-adapter)
- `Model#id` returns the same type as FK columns of the same integer type on PG
- The 31 `Number()` wrappers in `autosave-association.test.ts` can be removed and tests still pass on all three CI adapters
