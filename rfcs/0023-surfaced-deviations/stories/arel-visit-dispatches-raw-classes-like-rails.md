---
title: "Arel Visitor#visit should class-dispatch raw values like Rails, retiring visitNodeOrValue"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`visitNodeOrValue` (`packages/arel/src/visitors/to-sql.ts`) has **no Rails
counterpart** — `grep -rn "node_or_value" vendor/rails/activerecord/lib/arel/`
is empty. It is a trails invention, and it exists to paper over a structural
divergence in the visitor base class.

Rails' `Visitor#visit` (`vendor/rails/activerecord/lib/arel/visitors/visitor.rb:27-33`)
dispatches on the **runtime class of any object**:

```ruby
def visit(object, collector = nil)
  dispatch_method = dispatch[object.class]
  ...
```

So `visit(1)` → `visit_Integer` (`to_sql.rb:824-826`), `visit("x")` →
`visit_String` → `unsupported` → raises (`to_sql.rb:842`). Raw values and Arel
nodes flow through the _same_ dispatch; there is no second entry point.

Trails' `Visitor.visit` (`packages/arel/src/visitors/visitor.ts:53-71`) instead
looks `object.constructor` up in a dispatch table keyed on **Node constructors**
and throws `UnsupportedVisitError("Unknown node type: Number")` for a raw value.
Because raw values cannot go through `visit`, trails grew `visitNodeOrValue` as a
parallel hand-rolled `typeof` chain, and every caller that might hold a raw value
calls it instead of `visit` (`to-sql.ts` ~20 call sites; also `mysql.ts:149-218`,
`postgresql.ts:14-107`).

Consequences, all downstream of the same root cause:

- The Rails-native ports (`visitInteger`, `visitString`, `visitNilClass`,
  `visitFloat`, `visitFalseClass`, `visitTrueClass`, `visitDate`, `visitTime`,
  `visitBigDecimal`, …, `to-sql.ts` ~1369-1465) are unreachable via `visit` —
  nothing keys them in the dispatch table. #4871 wired the integral branches to
  `visitInteger` by direct call; the rest are still dead.
- The `typeof` chain must re-derive dispatch decisions that Rails gets from
  `object.class`, which is how the `Number.isFinite` invention (no Rails
  analogue; Rails splits Integer-renders vs Float-raises) got in.
- Two methods must be kept in agreement about the same subject, which has
  already drifted twice within a single PR (#4871 review rounds 3 and 4).

Note this is the **root cause** of `arel-raw-value-dispatch-raises-like-rails`,
which converges the same tolerance from the other end (routing
`visitNodeOrValue`'s branches to the existing `unsupported` ports while keeping
the invented method). That story is the tactical fix and is already in flight
as PR #4873; this one is the structural convergence that would make
`visitNodeOrValue` deletable. **Sequence them** — do not work this until
PR #4873 lands, or they will collide in the same branches.

Note also the AR-facing path is unaffected either way: `predications`'
`in()`/`eq()` wrap values via `quotedNode` (`packages/arel/src/predications.ts:142-151`)
into `Casted` nodes, which route through `quote()` (`to_sql.rb:87-90`).

## Acceptance criteria

- [ ] `Visitor.visit` dispatches on the runtime class for raw JS values as Rails
      does (`visitor.rb:27-33`) — `number` → `visitInteger`, `string` →
      `visitString`, `boolean` → `visitTrueClass`/`visitFalseClass`, etc. —
      rather than only on Node constructors.
- [ ] The Rails-native `visit_*` ports become reachable through `visit`, with no
      direct-call shims left behind (including the `visitInteger` calls added
      by PR #4871 as an interim structural anchor).
- [ ] `visitNodeOrValue` is deleted, or the residue that must stay is documented
      with the Rails anchor for why (it has no Rails counterpart, so "it stays"
      needs justifying).
- [ ] Callers in `to-sql.ts`, `mysql.ts` and `postgresql.ts` migrated to `visit`.
- [ ] Depends on `arel-raw-value-dispatch-raises-like-rails` (PR #4873) landing
      first — same branches.
- [ ] api:compare / test:compare delta non-negative. Expect api:compare to stop
      reporting `visitNodeOrValue` as a TS-only extra.
