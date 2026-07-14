---
title: "arel-predications-unboundable-duck-types-like-rails"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4876 (arel-unboundable-sign-duck-types-like-rails).

**Scope note (re-scoped after #4876 review).** #4876 converged BOTH live
`unboundableSign` implementations onto Rails' duck-typed `unboundable?`:
the visitor's (`packages/arel/src/visitors/to-sql.ts`, mirroring
`arel/visitors/to_sql.rb:905-907`) and `predications-range.ts`'s (mirroring
`arel/predications.rb:252-253`), which had an `infinitySign` fallback that made
`between(Float::INFINITY..3)` emit `1=0` where Rails emits `lteq(3)`.
**Neither of those is in scope here — do not re-file them.**

What remains is the third copy, which is dead surface rather than a live bug.

`packages/arel/src/predications.ts:363-368` stubs the predicate:

```ts
isUnboundable(this: PredicationHost, value: unknown): boolean {
  void this;
  void value;
  return false;
},
```

with the comment "The TS port has no analog of Ruby's `unboundable?` protocol,
so this returns false; kept for surface fidelity."

That comment is **false**. Trails has three producers of the protocol:
`QueryAttribute#isUnboundable`
(`activerecord/src/relation/query-attribute.ts:96`), `BindParam#isUnboundable`
(`arel/src/nodes/bind-param.ts:50`), and `UnboundableBound#isUnboundable`
(`activerecord/src/relation/predicate-builder/range-handler.ts:21`).

It is **latent, not live**: the real `between` / `not_between` path is ported in
`packages/arel/src/predications-range.ts`, which reads the protocol correctly as
of #4876. The stub is reachable only via `Attribute#isOpenEnded`
(`arel/src/attributes/attribute.ts:375-385`) and `Attribute#isUnboundable`
(`:371-373`), neither of which has a live call site. It is a trap: anything that
starts routing `between` through `Predications.isOpenEnded` silently loses
unboundable collapse (#4433).

The real question this story must answer is the duplication. Rails has exactly
ONE `unboundable?` in `predications.rb` serving `between`/`not_between`; trails
has it in two files (`predications.ts` stubbed, `predications-range.ts` real),
plus the visitor's separate-and-legitimate copy (Rails also defines it twice —
`to_sql.rb:905` and `predications.rb:252`).

### Second defect: `infinite?` returns a boolean, not the sign

`infinitySign` (`arel/src/predications-range.ts`) keeps an `r === true -> 1`
arm — the coercion #4876 removed from both `unboundableSign` copies as
unanchored. Here it is **not** dead, and the reason is a real deviation.

Rails' `QueryAttribute#infinite?` (`query_attribute.rb:42-44`) is:

```ruby
def infinite?
  infinity?(value_before_type_cast) || serializable? && infinity?(value_for_database)
end

def infinity?(value)
  value.respond_to?(:infinite?) && value.infinite?
end
```

`Float#infinite?` returns `1 | -1 | nil`, so `infinite?` yields the **SIGN**.
Trails' `QueryAttribute#isInfinite`
(`activerecord/src/relation/query-attribute.ts:89-94`) returns a plain
`boolean`, and `BindParam#isInfinite` (`arel/src/nodes/bind-param.ts:45-48`)
delegates to it despite its `number | null` annotation — so `true` genuinely
reaches `infinitySign` at runtime (probed on #4876).

That makes `infinitySign` sign-wrong for a -Infinity QueryAttribute bind:
`r === true` yields `+1` where Rails gives `-1`. It is **latent** — trails'
RangeHandler passes cast values or an `UnboundableBound`, never a
QueryAttribute, as a range bound (`predicate-builder/range-handler.ts`).

Fix `QueryAttribute#isInfinite` to return the sign like Rails, THEN drop the
`r === true` arm. **Do NOT drop the arm alone** — that regresses +Infinity
detection. #4876 left this deliberately: different predicate (`infinite?`, not
`unboundable?`), third package. The reasoning is recorded in the comment at
`infinitySign`.

### Do not "converge" this: `infinite?` is on Quoted, not Casted

`infinitySign` must keep unwrapping `Quoted` and must NOT unwrap `Casted`.
`infinite?` is defined on `Quoted` (`casted.rb:43-45` — the `Quoted` class
lives in `casted.rb`); `Casted` defines none (`casted.rb:5-35`), so
`open_ended?(Casted(INFINITY))` is false in Rails. Trails' node layout already
matches (verified on #4876).

## Acceptance criteria

- [ ] `Predications.isUnboundable` duck-types the protocol like
      `predications.rb:252-253` instead of `return false`; the stale
      "no analog of Ruby's `unboundable?` protocol" comment is removed.
- [ ] The `predications.ts` / `predications-range.ts` split is resolved: either
      `predications-range.ts`'s `unboundableSign` / `infinitySign` / `isOpenEnded`
      collapse onto the `Predications` versions, or the split is documented as
      the intentional Rails-layout mapping with an anchor. Rails has one copy per
      Ruby file; two copies in the same layer is a deviation either way.
- [ ] `Attribute#isOpenEnded` / `Attribute#isUnboundable`
      (`attributes/attribute.ts:367-385`) either gain a live caller or are
      removed — do not leave dead surface behind.
- [ ] `QueryAttribute#isInfinite` returns the sign (`1 | -1 | false`) like
      `query_attribute.rb:42-44`, not a `boolean`; `BindParam#isInfinite`'s
      `number | null` annotation stops lying. Only then drop `infinitySign`'s
      `r === true` arm. See "Second defect" above — do not drop it alone.
- [ ] `infinitySign` still unwraps `Quoted` and still does NOT unwrap `Casted`
      (see above); `open_ended?(Casted(INFINITY))` stays false.
- [ ] `between` / `not_between` behavior unchanged from #4876's converged state:
      `between(Float::INFINITY..3)` → `lteq(3)`, `between(Float::INFINITY..)` →
      `in([])` (via `infinity?`, predications.rb:42), out-of-range bound collapse
      (#4433) → `in([])`.
- [ ] api:compare / test:compare delta non-negative.
