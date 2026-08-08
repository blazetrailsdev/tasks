---
rfc: "0086-prism-codegen-productionization"
title: "Prism codegen productionization: convergence guard + generation fidelity"
status: closed
created: 2026-07-31
updated: 2026-08-05
owner: "@deanmarano"
packages:
  - "activerecord"
clusters: []
---

## Summary

Successor to RFC 0065 (closed with spike PR #4912). PR #5727 revived the
prism-codegen spike and rebuilt it on honest foundations: handlers emit
TypeScript AST nodes (`ts.factory`) with no raw-text escape hatch, so output
is parse-clean by construction; coverage counts only nodes with a
well-formed, semantics-decided image (89.6% of 11,244 nodes, 406/469 defs
fully handled, 0 parse errors); and a conformance scorer
(`pnpm codegen:score`) compares every clean generated def against its port
counterpart via normalized body skeletons (baseline 32 matched / 267
divergent / 104 missing = 10.7%).

This RFC covers the productionization path from that baseline: turning the
scorer into the zero-deviation convergence guard (the repo's north star is
no undocumented deviations from Rails), and the generation improvements
that convert divergent-for-generator-reasons rows into genuine port-audit
signal.

## Owner-decided conventions (from #5727)

Runtime shims allowed (`runtime.ts`: `caseEq`, `range`); `<<` maps to
`.push()`; the block protocol (implicit trailing `block` param, `yield` to
`block(...)`, `block_given?` to `block !== undefined`, `&:sym` to
`x => x.sym()`); receiverless calls resolve to `this` (Prism disambiguates
locals at parse time); statement-position module-level `super` is omitted
per the port's composition-point flattening.

## Principles (carried from the spike)

- No silently-lossy translations: a handler emits a faithful image or
  declines, and declining counts the whole subtree as passthrough.
- Validate before evaluate: no coverage double-counting on decline.
- The scorer's denominator is the passthrough-free def set only.

## Stories

1. Convergence guard with catalog exclusions (scorer minus
   SKIP/SCOPED_SKIP/api-compare exclude lists, checked-in baseline,
   ratchet on new uncatalogued rows) — the highest-value deliverable.
2. Delegate-macro receiver resolution (`delegate :x, to: :model`) — the
   dominant remaining generator-side divergence.
3. Static super linearization (include-order MRO from base.rb; direct
   next-definer calls; outside-corpus declines).

## Non-goals

Autonomous porting. The generator is a scaffolding accelerator and a guard
input, not a correctness oracle; semantic verification stays with the
test-compare / api-compare pipelines.
