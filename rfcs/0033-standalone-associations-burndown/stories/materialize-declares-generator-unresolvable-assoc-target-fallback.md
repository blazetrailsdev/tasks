---
title: "materialize-declares-generator-unresolvable-assoc-target-fallback"
status: in-progress
updated: 2026-07-04
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4558
claim: "2026-07-04T17:04:28Z"
assignee: "materialize-declares-generator-unresolvable-assoc-target-fallback"
blocked-by: null
closed-reason: null
---

## Context

`has-one-through-associations.test.ts` cannot be materialized (baked)
typecheck-green because the generator emits a dangling class name for an
unresolvable plain (non-`through:`) association target.

The throwaway class in the "has one through relationship cannot have a
counter cache" test (packages/activerecord/src/associations/has-one-through-associations.test.ts,
~line 753) is:

```ts
class Thing extends Base {
  static {
    this.hasOne("otherThing");
    this.hasOne("thing", { through: "otherThing", counterCache: true });
  }
}
```

`otherThing` has no corresponding model, so `classify("otherThing")` →
`OtherThing`, which is neither in the model registry nor lexically visible.
The synthesizer (`renderSingularAssoc` in
`packages/activerecord/src/type-virtualization/synthesize.ts`) emits
`declare otherThing: OtherThing | null;` and no import is added, producing
TS2304 `Cannot find name 'OtherThing'`.

`through:` targets already fall back to `Base` when unresolvable
(`buildAssociationTargets` → `resolveThroughTarget ?? "Base"` in
`scripts/materialize-model-declares.ts`), but plain
`belongsTo`/`hasOne`/`hasMany` targets do not.

This was discovered while shipping
`materialize-declares-generator-fk-primarykeyvalue-gap` (the FK
PrimaryKeyValue widening). The file's original FK-assignment symptom was
removed by the #4375 has_one_through rewrite; this dangling-target gap is
what now blocks the bake.

## Acceptance criteria

- [ ] Plain (non-`through`) association targets that resolve to a class name
      that is neither in the model registry nor lexically visible fall back
      to `Base` (or the declare is skipped), so no dangling class name is
      emitted.
- [ ] `has-one-through-associations.test.ts` bakes typecheck-green and its
      suite passes.
- [ ] Canonical model bake output is unchanged for resolvable targets
      (regression guard).
