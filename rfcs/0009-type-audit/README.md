---
rfc: "0009-type-audit"
title: "ActiveRecord type-audit remainder (W1b + follow-ups + W4)"
status: active
created: 2026-05-30
updated: 2026-05-30
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - type-cleanup
---

# RFC 0009 — ActiveRecord type-audit remainder

## Summary

Waves 1–3 of the activerecord `any`/`as any` cleanup shipped. This RFC tracks the
remainder: W1b (variadic rest overloads), a ~150 LOC small-follow-ups bundle, and
W4 (the deferred, high-risk reflection discriminated union). The headline counts
will never reach zero — Rails-mirror code has irreducible dynamic patterns and
legitimate cross-package boundary casts.

## Motivation

`activerecord` carries the bulk of the monorepo's type debt (upstream packages are
type-clean). Waves 1–3 drove `this: any` from 131 → ~5 and `as any` in
`associations.ts` from 90 → ~20. What's left is a small mechanical tail plus the
reflection refactor that touches every reflection consumer.

## Design

The audit's pattern taxonomy drives the remaining work:

- **P5 — variadic rest re-spread** (W1b): TS can't preserve rest-tuple shape
  across reassignment; declare overloads on the receiving method (the
  `normalizes()` technique, #1482) instead of `...(args as any)`.
- **Small follow-ups** (P3/P4/P8 residue): `Errors<TBase>` PR D, Validations
  mixin tightening, `BiasableQueue` shape, `_canRouteThrough*` typing,
  collection-proxy cast drop, HABTM `Reflection.create` overload,
  `processDependentAssociations` errors cast, `defineReaders` `this: any`.
- **P2 — polymorphic reflection** (W4): discriminated union on
  `AbstractReflection.macro` + typed helpers. High risk (consumed everywhere) —
  deferred.
- **P6 — cross-package boundary casts**: legitimate; left alone, `@internal`-doc'd.

## Alternatives considered

- **Drive all counts to zero.** Rejected — Rails-mirror dynamic patterns (P2
  reflection, P6 boundary casts) are irreducible; chasing zero adds risk for no
  parity gain. Targets are realistic, not absolute.
- **Do W4 reflection first (biggest count).** Rejected — highest blast radius;
  the audit explicitly sequences mechanical/low-risk first, reflection last.

## Rollout

1. [w1b-variadic-rest-overloads](stories/w1b-variadic-rest-overloads.md) (ready).
2. [small-followups-bundle](stories/small-followups-bundle.md) (ready).
3. [w4-reflection-discriminated-union](stories/w4-reflection-discriminated-union.md)
   (deferred — do last or accept as parity tax).

Re-run `pnpm tsx scripts/type-audit/audit.ts` after each PR; `last-run.json` is
the trendline.

## Open questions

1. **W4 worth it?** The reflection discriminated union is high-risk multi-PR; may
   be better left as a documented `(this as ReflectionWithMacro<…>)` helper than a
   full scrub. Decide before promoting W4 out of `draft`.

## Stories

<!-- generated: stories table -->

| ID                                                                                | Title                                                                                      | Status      | Est LOC | Cluster      |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------- | ------- | ------------ |
| [pg-typemap-init-param-type-hole](stories/pg-typemap-init-param-type-hole.md)     | Remove HashLookupTypeMap cast in PG static initializeTypeMap (reconcile with base TypeMap) | in-progress | 80      | —            |
| [small-followups-bundle](stories/small-followups-bundle.md)                       | Type-audit small follow-ups bundle (~150 LOC)                                              | done        | 150     | type-cleanup |
| [w1b-variadic-rest-overloads](stories/w1b-variadic-rest-overloads.md)             | W1b — variadic rest overloads (drop relation.ts as-any spreads)                            | done        | 100     | type-cleanup |
| [w4-reflection-discriminated-union](stories/w4-reflection-discriminated-union.md) | W4 — Reflection discriminated union (deferred, high risk)                                  | done        | 300     | type-cleanup |

## Changelog

- 2026-05-30: initial RFC, migrated from
  `trails/docs/activerecord/activerecord-type-audit.md`.
