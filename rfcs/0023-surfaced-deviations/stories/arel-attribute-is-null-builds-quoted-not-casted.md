---
title: "arel-attribute-is-null-builds-quoted-not-casted"
status: claimed
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-14T23:31:12Z"
assignee: "arel-attribute-is-null-builds-quoted-not-casted"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4874 (arel-attribute-quoted-node-nil-builds-casted),
which converged `Attribute#quotedNode` onto `buildQuoted(value, this)` so
`attr.eq(null)` builds `Casted(nil, attr)` and type-casts through the column.
`isNull` / `isNotNull` are the same `Quoted(null)` deviation one method over,
and were left out of that PR for scope.

`packages/arel/src/attributes/attribute.ts:229-235`:

```ts
isNull(): Equality {
  return new Equality(this, new Quoted(null));
}

isNotNull(): NotEqual {
  return new NotEqual(this, new Quoted(null));
}
```

Two problems:

1. **The methods have no Rails counterpart.** There is no `is_null` /
   `not_null` / `is_not_null` anywhere in `vendor/rails/activerecord/lib/arel/`
   — verified by grep over the whole arel lib, not just `predications.rb`.
   Rails spells this `attr.eq(nil)` / `attr.not_eq(nil)`, which route through
   `quoted_node` → `build_quoted(other, self)` (`predications.rb:244-246`) →
   `Casted(nil, attr)` (`casted.rb:48-58`). These are trails inventions.

2. **They hard-code `Quoted(null)`**, so after #4874 `attr.eq(null)` and
   `attr.isNull()` build _different_ right-hand nodes for the same query:
   `Casted(nil, attr)` vs `Quoted(null)`. Both spell `IS NULL` today (both
   define `nil?` as `value.nil?` — `casted.rb:15`, `casted.rb:41`), but only
   the `Casted` form carries the column's type-cast context via
   `value_for_database` (`casted.rb:17-23` vs the bare alias at
   `casted.rb:38`). This is exactly the divergence #4874 removed from
   `quotedNode`.

These two call sites are the only remaining `Quoted` uses in `attribute.ts`
and the sole reason the `Quoted` import on line 28 survives.

Decide between: (a) delete the invented predicates outright and migrate callers
to `eq(null)` / `notEq(null)`, or (b) keep them as a thin trails convenience but
implement them as `this.eq(null)` / `this.notEq(null)` so they inherit the
`Casted` path. (a) is the fidelity-correct end state; audit caller count first.

## Acceptance criteria

- [ ] `isNull` / `isNotNull` no longer construct `Quoted(null)` directly; a nil
      right-hand side from an Attribute goes through `quotedNode` and becomes
      `Casted(nil, attr)`, matching `attr.eq(null)`.
- [ ] Decision recorded (delete vs. delegate) with the caller audit that
      justifies it; if deleted, all in-repo callers migrate to `eq(null)`.
- [ ] `IS NULL` / `IS NOT NULL` SQL is unchanged for every existing caller.
- [ ] If no `Quoted` uses remain in `attribute.ts`, the import goes too.
- [ ] api:compare / test:compare delta non-negative; wide ratchet green.
