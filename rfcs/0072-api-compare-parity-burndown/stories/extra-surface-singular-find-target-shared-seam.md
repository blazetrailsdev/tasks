---
title: "extra-surface-singular-find-target-shared-seam"
status: closed
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by singular-find-target-becomes-instance-method (same file + same seam). The unique finding from the #5366 review — HasOneAssociation bypasses the singular findTarget entirely via loadHasOne (has-one-association.ts doAsyncFindTarget), where Rails defines find_target once on SingularAssociation for BOTH subclasses (singular_association.rb:47; belongs_to_association.rb:124 specializes only find_target?; has_one_association.rb:6 has no override) — is folded into that story's scope."
---

## Context

`findTarget` in `packages/activerecord/src/associations/singular-association.ts`
(landed by #5360) is documented as `SingularAssociation#find_target` but is a
belongs_to-shaped top-level loader: it takes the owner/name/options triple and
gates on `_findTargetReachable(..., "belongsTo")`. `HasOneAssociation` does not
go through it — it still calls `loadHasOne` from its own
`doAsyncFindTarget` override
(`packages/activerecord/src/associations/has-one-association.ts`).

Rails defines `find_target` ONCE on `SingularAssociation`, shared by both
singular subclasses:

- `vendor/rails/activerecord/lib/active_record/associations/singular_association.rb:47`
  — `def find_target(async: false)`, the only definition.
- `vendor/rails/activerecord/lib/active_record/associations/belongs_to_association.rb:124`
  — `BelongsToAssociation` specializes only `find_target?`, not `find_target`.
- `vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:6`
  — `HasOneAssociation` has NO `find_target` override.

So the seam belongs on the `SingularAssociation` instance, reached by has_one
and belongs_to alike, rather than existing as a belongs_to-shaped helper with
has_one routed around it.

Reported by review on #5366 (which relocated the has_many loader to
`HasManyAssociation#findTarget`); the file is untouched by that PR, so it is
carved out here. #5366 establishes the target shape on the collection side:
a `protected findTarget()` instance method that `loadTarget` runs directly,
with the owner/name/options function kept `@internal` behind it for the
callers that have no association instance.

Related: [[extra-surface-defuse-has-many-find-target]].

## Acceptance criteria

- `SingularAssociation` exposes a `findTarget` instance seam that BOTH
  `HasOneAssociation` and `BelongsToAssociation` reach; neither bypasses it.
- `loadHasOne` no longer exists as a separate top-level loader under that name
  in `associations.ts` — it is the has_one arm behind the shared seam.
  `BelongsToAssociation` keeps specializing only the `findTarget?` reachability
  gate, matching `belongs_to_association.rb:124`.
- Any remaining owner/name/options function is `@internal` and justified at the
  declaration site, not exposed as Rails surface.
- `pnpm api:compare && pnpm api:extra --package activerecord --novel-only`
  shows the `associations.ts` novel count drop by the number of names removed.
  Record before/after in the PR body.
- has_one, has_one :through, belongs_to, and inverse association suites pass;
  no test renames.
- No `node:*` imports, no `process.*`, async fs only, camelCase only.
- Under the 500 LOC ceiling. Single PR from `main`, no stacking.
