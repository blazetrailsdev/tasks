---
title: "ho-through-source-klass-resolution"
status: claimed
updated: 2026-06-20
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-20T18:49:28Z"
assignee: "ho-through-source-klass-resolution"
blocked-by: null
---

## Context

`Project has_one :leadDeveloper, through: :firm` (no explicit `:source`) fails to
resolve its target class. The source reflection on `Firm` is
`leadDeveloper` (`className: "Developer"`), but `ThroughReflection`'s klass/inverse
resolution computes the target class from the association NAME, deriving a
non-existent `LeadDeveloper` model instead of delegating to the source
reflection's klass.

Surfaced while un-skipping `has one through with belongs to on disable joins` in
`packages/activerecord/src/associations/has-one-through-disable-joins-associations.test.ts`
(RFC 0030 story a3-has-one-and-through). That test is left `it.skip` with a
BLOCKED/ROOT-CAUSE tag pending this fix.

Trails refs:

- `packages/activerecord/src/reflection.ts:1140` (computeClass throws `Model 'LeadDeveloper' not found`)
- `packages/activerecord/src/reflection.ts:797` HasOneReflection.inverseOf → klass
- `packages/activerecord/src/test-helpers/models/project.ts:50` (leadDeveloper / leadDeveloperDisableJoins)
- `packages/activerecord/src/test-helpers/models/company.ts:204` (Firm.leadDeveloper, className "Developer")

Rails ref: activerecord has_one :through source-reflection klass delegation.

## Acceptance criteria

- [ ] `ThroughReflection` resolves the target klass via the source reflection (not the
      association name) when `:source`/`:class_name` are omitted, matching Rails.
- [ ] Un-skip `has one through with belongs to on disable joins` and it passes
      (both join and disable_joins paths: 1 query w/ INNER JOIN vs 2 queries w/o).
- [ ] No regressions in existing has_one/has_one_through reflection tests.
