---
title: "scorer-as-const-mixin-map"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5834
claim: "2026-08-01T22:45:58Z"
assignee: "scorer-as-const-mixin-map"
blocked-by: null
closed-reason: null
---

## Context

`indexPortFile` (scripts/prism-codegen/score.ts) resolves a port's mixin
indirection map — `export const FinderMethods = { findByBang: performFindByBang, ... }`
— only when the initializer is a bare `ObjectLiteralExpression`. The real map at
`packages/activerecord/src/relation/finder-methods.ts:763-792` ends `} as const;`,
so the declaration is an `AsExpression` and the whole map is skipped: none of
`findBy`, `findByBang`, `last`, `take`, … resolve in their own twin file, and the
rows read as `missing` (or get borrowed from an unrelated file via the cross-file
fallback).

Found while fixing `scorer-initialize-dup-misresolution` (the ownership rule now
keeps `finder_methods.rb::findByBang` honestly `missing` instead of resolving it
to core.ts's delegator).

## Acceptance criteria

- `indexPortFile` unwraps `as const` / `satisfies` / parenthesized initializers
  before looking for the object literal.
- `relation/finder_methods.rb` rows resolve against `relation/finder-methods.ts`
  (findBy, findByBang, last, take, … stop reading as `missing`).
- `convergence-baseline.json` regenerated for the resulting status flips.
- A regression test pins the `as const` map shape.
