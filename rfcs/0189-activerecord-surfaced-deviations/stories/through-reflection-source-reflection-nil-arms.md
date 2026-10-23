---
title: "ThroughReflection: drop nil-tolerant source_reflection arms, port AssociationReflection#actual_source_reflection"
status: ready
updated: 2026-10-22
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/reflection.ts` (after trails#9090) deviates from Rails in two places in `ThroughReflection`:

- `hasScope` / `isNested` call `this.sourceReflection?.hasScope()` / `?.isThroughReflection()` with optional chaining. Rails' `has_scope?` and `nested?` (`vendor/rails/v8.0.2/activerecord/lib/active_record/reflection.rb:1069-1078`) call `source_reflection.has_scope?` and `through_reflection.has_scope?` directly, so they raise on a nil reflection.
- `actualSourceReflection` reads `(src as any).actualSourceReflection?.() ?? src`. Rails defines `actual_source_reflection` on `AssociationReflection` (`reflection.rb:351`, which returns `self`) and on `ThroughReflection` (`:1199`, which is `source_reflection.actual_source_reflection`). trails only ports the `ThroughReflection` half.

## Acceptance criteria

- [ ] Port `AssociationReflection#actualSourceReflection` (protected, returns `this`) at the Rails position. `ThroughReflection#actualSourceReflection` becomes `this.sourceReflection!.actualSourceReflection()` with no cast and no `if (!src) return this` arm.
- [ ] `hasScope` and `isNested` drop the optional chaining and mirror `reflection.rb:1069-1078`.
- [ ] `parity:api:calls` and `parity:api:extra:gate` are green, and the reflection tests pass.

## Audit 2026-10-22

Current lines (2026-10-22): `reflection.ts:1254` (`hasScope`) and `:1431`
(`actualSourceReflection`).
