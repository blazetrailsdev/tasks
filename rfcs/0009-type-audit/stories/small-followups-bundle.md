---
title: "Type-audit small follow-ups bundle (~150 LOC)"
status: done
updated: 2026-06-07
rfc: "0009-type-audit"
cluster: type-cleanup
deps: []
deps-rfc: []
est-loc: 150
priority: 51
pr: 2987
claim: "2026-06-07T01:15:57Z"
assignee: "small-followups-bundle"
blocked-by: null
---

## Context

A bundle of small, low-risk type tightenings left after Waves 1–3, explicitly
described as bundleable (~150 LOC).

See RFC 0009 §Open follow-ups.

## Acceptance criteria

- [ ] `Errors<TBase>` PR D — typed base for `associations/nested-error.ts`
- [ ] `Validations` mixin interface tightening + `runValidationsBang` param (~10 LOC)
- [ ] `BiasableQueue` module shape — `include()` module holds only instance
      methods; export `BiasedConditionVariable` standalone (~5 LOC)
- [ ] Type `_canRouteThroughViaAssociationScope` /
      `_canRouteThroughViaDisableJoinsAssociationScope` with
      `ReflectionLike | null | undefined` (~20 LOC)
- [ ] `collection-proxy.ts` ~739: drop `(ctor as any)._reflectOnAssociation?.()`
      cast (now declared, #1524) (~15 LOC)
- [ ] HABTM `Reflection.create`/`addReflection`: discriminated-union overload or
      typed factory to drop `assocDef.type as any` / `ref as any` (~20 LOC)
- [ ] `processDependentAssociations`: drop `(record as any).errors?.add(...)` ×2
      via `ErrorsLike`/`errors` on Base (~10 LOC)
- [ ] `CollectionAssociation.defineReaders` `this: any` (circular import) addressed
- [ ] Drop ~5 LOC redundant `as typeof Base` in `attributes.ts` + `persistence.ts`

## Notes

From the type-audit plan (small follow-ups bundle). May split if it exceeds the
ceiling. Re-run the type-audit script after to update the trendline.
