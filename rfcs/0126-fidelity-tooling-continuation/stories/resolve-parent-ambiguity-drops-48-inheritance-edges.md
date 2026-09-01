---
title: "48 ambiguous parent names leave their inheritance edge unfollowed"
status: draft
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7352 (RFC 0126), which touched
`resolveEntityByDeclaringFile` in `scripts/api-compare/compare.ts`.

RFC 0126's `api-compare-resolve-parent-tie-picks-first-candidate` (#7238)
correctly stopped `resolveParent` binding `candidates[0]` on a zero-score tie:
an unseparated tie now resolves to **nothing**, and `onAmbiguous` reports it.
That was the right call — the old fallback was order-dependent and silently
mis-attributed inherited methods (PR #5405 dropped `test_request.rb` from 13
matched methods to 9).

What it left behind is a warned-but-unburnt population. A full
`pnpm parity:api` run prints, per package:

```text
[parity:api] activerecord: 28 ambiguous parent name(s) — every candidate shares
zero leading path segments with the child, so the inheritance walk followed
none: Attribute, AttributeOptions, AttributeRegistration, Base, BigIntegerType,
BinaryType, Calculations, Callbacks, ClassMethods, DatabaseStatements,
DateType, DecimalType, Dirty, EachValidator, Error, InstanceMethods,
IntegerType, JSON, Model, Module, Object, Query, QueryCache, Quoting,
SchemaStatements, Serialization, StringType, ValueType
```

48 names across 7 packages: activerecord 28, actiondispatch 7, rack 5,
activemodel 4, actioncontroller 2, arel 1, abstractcontroller 1.

Each one is an inheritance edge the walk **does not follow at all**, so
`getInherited` never pools that parent's method names under the child's file
key — which is what `directMatch` consults. A Ruby method trails really does
answer through inheritance therefore reads as missing. The names are not
obscure: `Base`, `Model`, `ClassMethods`, `SchemaStatements`, `Quoting`,
`Calculations`, `DatabaseStatements` and `Serialization` are the spine of the
AR/AM inheritance graph.

The warning is printed and nothing gates it, so the population can grow
silently.

## Converged shape

The extractor already records the file a name resolved to —
`superclassFile` for an `extends` clause, `extendsFiles[name]` for an
`include()`/`extend()` edge — and an exact match on it wins outright, before
proximity is consulted at all. A warned name means that record is **absent**,
which per the docstring happens only when the symbol resolved outside the
package's `src` (a dep package, a mixin-factory call).

So the fix is upstream of the tie-break: make `extract-ts-api.ts` record a
declaring file for those two cases too, rather than teaching the proximity
heuristic more tricks. A dep-package symbol has a real resolved path (the
`.d.ts` it came from, mapped back to that package's `src`-relative name), and a
mixin-factory call has the factory's declaration site.

Burn the count down and gate it, the way the other RFC 0126 ratchets are
only-shrink, so a new unresolved parent is a red run rather than a line in a
warning nobody reads.

## Acceptance criteria

- [ ] `pnpm parity:api` reports zero ambiguous parent names, or a documented
      remainder with a per-package mark that only shrinks.
- [ ] The matched/missing delta is reported per package. A RISE is the expected
      shape (inheritance edges that were dropped now pooling), and each newly
      matched pair is spot-checked against `vendor/rails` to confirm trails
      really does answer it through that parent.
- [ ] `inheritance: N/M` and `arity` figures accounted for.
