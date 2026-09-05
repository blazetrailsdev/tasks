---
title: "Short-circuit operators get their own skeleton token instead of if"
status: ready
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: arm-parity-tooling
packages: []
deps: ["ruby-logical-op-assign-emits-no-skeleton-arm"]
deps-rfc: []
est-loc: 160
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`extractSkeleton` emits `if` for every short-circuit operator:
`isSkeletonLogicalOp` (`scripts/api-compare/extract-ts-api.ts:4220`) returns
true for `||`, `&&`, `??`, `||=`, `&&=` and `??=`, and the `BinaryExpression`
branch (`:4253`) pushes `if` between the operands. The Ruby side does the same
for `||` / `&&` / `and` / `or` (`SKELETON_LOGICAL_OPS`,
`extract-ruby-api.rb:2710`, applied at `:2744`) — and, once
`ruby-logical-op-assign-emits-no-skeleton-arm` lands, for `||=` / `&&=`.

That is faithful for `a || b`, but `??` has no Ruby operator at all. Its
Ruby counterparts emit nothing: a kwarg default (`def f(x: nil)`), a
`fetch(k, default)`, an `options[:k] || default` that Rails writes as a
default parameter, a `&.` chain. So every `?? default` in a port reports an
invented `if`, and the noise-floor audit's largest single artefact class is
exactly that (rows 7, 12, 18, 22, 44, 50, 54, 63, 68, 71, 75 — "nullability"
and "kwarg-default lowering"). Today's report shows **6055 invented `if`**
tokens against 598 missing; the short-circuit contribution is most of the gap.

RFC 0113's Non-goals say predicate semantics are not compared, and a
short-circuit is not an arm in the sense the RFC's clusters use — a
`missing-arm` story is about a dropped `elsif`, never a dropped `||`. So the
projection should not fold the two together.

Fix: emit a distinct token per operator family on both sides — `or` for
`||` / `or` / `||=` / `??` / `??=`, `and` for `&&` / `and` / `&&=` — instead
of `if`. `CONTROL_TOKENS` (`report-arms.ts:42`) keeps `if` / `loop` / `try` /
`throw` so the arms verdict ignores short-circuits, and the report gains a
separate "Short-circuit mismatches" section over the `or` / `and` projection so
a genuinely dropped `||` guard (the `compute-cache-version` shape the RFC
opens with is one) is still visible — reported, not folded into the arm
count.

`??` maps onto `or` rather than a third token because `x || default` is the
Ruby spelling of the same fallback; the doubled `?? ""`-on-a-kwarg case that
the audit tagged is then a short-circuit row, not an arm row, which is where it
belongs.

Coordinate with `ruby-logical-op-assign-emits-no-skeleton-arm` (ready): both
touch `:2744-2750`; whichever lands second rebases.

## Acceptance criteria

- [ ] Both extractors emit `or` / `and` for the operator families above and
      never `if` for an operator. Unit tests pin `a || b`, `a ??= b`,
      `a && b` on the TS side and `a || b`, `a and b`, `@a ||= b` on the Ruby
      side.
- [ ] `controlArms` still projects onto `if` / `loop` / `try` / `throw`; the
      `or` / `and` projection gets its own multiset diff and report section.
- [ ] `pnpm parity:api:arms:report` before/after is recorded in the PR body;
      the invented-`if` total drops by at least the number of `??` /
      `??=` sites in the compared population (count them with a one-off
      `tsx` script and quote the number).
- [ ] Nothing new gates.
