---
title: "activerecord: ThroughAssociation source_reflection, ensure_mutable and ensure_not_nested read the reflection directly"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
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

Surfaced while converging `associations/through-association.ts` in trails#8483, which made `throughReflection`, `throughAssociation` and `constructJoinAttributes` read `this.reflection` directly. Three sibling bodies in the same file still re-reflect the association off the owner's class and guard every read:

- `sourceReflection(assoc)` is an exported function doing `owner.constructor._reflectOnAssociation?.(assoc.reflection.name) ?? assoc.reflection` and then `?.sourceReflection ?? null`. Rails is `delegate :source_reflection, to: :reflection` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/through_association.rb:7`). `HasManyThroughAssociation#sourceReflection` and `HasOneThroughAssociation#sourceReflection` both call it.
- `ensureMutable` re-reflects, then reads `refl?.isHasOne?.() ?? this.reflection.type === "hasOne"` and `sourceRefl?.isBelongsTo?.() ?? sourceRefl?.macro === "belongsTo"`. Rails is `unless source_reflection.belongs_to?` / `if reflection.has_one?` (`through_association.rb:96-104`).
- `ensureNotNested` re-reflects, then reads `refl?.isNested?.()` and `refl.isHasOne?.() ?? this.reflection.type === "hasOne"`. Rails is `if reflection.nested?` / `if reflection.has_one?` (`through_association.rb:106-114`).

The association suites pass with `this.reflection` read directly in the three bodies #8483 converged, so the re-lookup is not load-bearing there. `through-cant-associate-error-takes-owner-and-reflection` owns the error constructor arguments in `ensureMutable`; this story is the reflection reads.

## Acceptance criteria

- [ ] `sourceReflection` is the delegation to `this.reflection.sourceReflection`, with no owner-class re-lookup and no `?? null`, declared where `delegate` puts it rather than as a free function taking the association.
- [ ] `ensureMutable` and `ensureNotNested` read `this.sourceReflection().isBelongsTo()`, `this.reflection.isHasOne()` and `this.reflection.isNested()` with no `?.` and no `type === "hasOne"` / `macro === "belongsTo"` fallback.
- [ ] `pnpm parity:api:arms:report --package=activerecord` shows no short-circuit row for `through-association.ts#ensureMutable` or `#ensureNotNested`.

## Verification

```bash
pnpm vitest run packages/activerecord/src/associations/has-many-through-associations.test.ts packages/activerecord/src/associations/has-one-through-associations.test.ts && pnpm parity:api:calls
```
