---
title: "arel-unboundable-sign-duck-types-like-rails"
status: in-progress
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4876
claim: "2026-07-14T21:01:12Z"
assignee: "arel-unboundable-sign-duck-types-like-rails"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4873 (arel-raw-value-dispatch-raises-like-rails).

Trails' `unboundableSign` (`packages/arel/src/visitors/to-sql.ts:2151-2172`)
conflates two distinct Rails predicates and invents a raw-scalar branch. Rails'
visitor-level `unboundable?` is purely duck-typed:

```ruby
def unboundable?(value)
  value.respond_to?(:unboundable?) && value.unboundable?
end
```

(`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb:905-907`)

Only two types answer it: `Arel::Nodes::BindParam#unboundable?`
(`arel/nodes/bind_param.rb:39-40`) and
`ActiveRecord::Relation::QueryAttribute#unboundable?`
(`active_record/relation/query_attribute.rb:46-51`), where it means
"serializes out of the column's range" (`value <=> 0`), NOT "is infinite".

Three consequences, all currently divergent:

1. **Raw `Float::INFINITY` does not short-circuit in Rails.** A Float does not
   respond to `unboundable?`, so `unboundable?` is false and the visitor falls
   through to `visit right` → `visit_Float` → `unsupported` → raises
   (`to_sql.rb:835`). Trails returns 1/-1 from a bare `Infinity`
   (`to-sql.ts:2152-2153`), collapsing to `1=0`/`1=1`.

2. **`Quoted`/`Casted` wrapping INFINITY does not short-circuit in Rails
   either.** Neither class defines `unboundable?` — `Casted` defines only
   `infinite?` (`arel/nodes/casted.rb:43-45`), which the _visitor_ never calls
   (`infinite?` is used by `predications#open_ended?`, `arel/predications.rb:248`,
   for range/between construction). So `attr.eq(Float::INFINITY)` builds
   `Equality(attr, Quoted(INFINITY))`, `unboundable?` is false, and Rails
   renders `"users"."id" = Infinity` (`quote()` → `when Numeric then value.to_s`,
   `abstract/quoting.rb:82`). Trails collapses it to `1=0`.

3. Trails' `unboundableSign` therefore drives collapse off `isInfinite()`
   (`casted.ts:112`, `bind-param.ts:45`), which is the `infinite?` analogue —
   the wrong predicate.

Measured on PR #4873: deleting the raw-scalar branch (lines 2152-2153) alone
fails 11 tests, because the `"value" in v` recursion (`to-sql.ts:2170`) bottoms
out on exactly that raw check — `Quoted`/`Casted` do not drive the sign
themselves. So this cannot be fixed by deleting two lines; it needs the
`infinite?`-vs-`unboundable?` split untangled.

The eight `unboundable short-circuits` tests
(`to-sql.test.ts:1759-1790`) assert the divergent behavior for
`Float::INFINITY` and will need to be reconciled against Rails. Note the
genuine out-of-range-bignum collapse (#4433) IS Rails behavior and must be
preserved — it flows through `QueryAttribute#unboundable?`, not through
`infinite?`.

Scoped out of #4873 deliberately: that story converges raw-value dispatch in
`visitNodeOrValue`; this is a different method with repo-wide predicate
consequences and its own test reconciliation.

## Acceptance criteria

- [ ] `unboundableSign` consults only the `unboundable?` analogue
      (`BindParam.isUnboundable()` / QueryAttribute), never `isInfinite()`,
      mirroring `to_sql.rb:905-907`.
- [ ] The invented raw-`Infinity` branch (`to-sql.ts:2152-2153`) is removed;
      a raw `Float::INFINITY` reaching a comparison visitor raises via
      `visit_Float` (`to_sql.rb:835`), per #4873's dispatch.
- [ ] `attr.eq(Float::INFINITY)` renders `= Infinity` (Rails behavior) or the
      divergence is documented with the Rails anchor and the caller requiring it.
- [ ] Out-of-range bignum collapse (#4433) still passes — it routes through
      `QueryAttribute#unboundable?`, a different predicate.
- [ ] The eight `unboundable short-circuits` tests reconciled against Rails;
      no test renamed.
- [ ] api:compare / test:compare delta non-negative.
