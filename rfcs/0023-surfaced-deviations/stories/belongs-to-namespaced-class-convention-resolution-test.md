---
title: "Faithful namespaced-class belongs_to type-mismatch test via convention resolution"
status: in-progress
updated: 2026-06-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4306
claim: "2026-06-30T02:54:32Z"
assignee: "belongs-to-namespaced-class-convention-resolution-test"
blocked-by: null
---

## Context

Surfaced in PR #4271 review (belongs-to-type-mismatch-validation). The ported
`raises type mismatch with namespaced class` test
(`packages/activerecord/src/associations/belongs-to-associations.test.ts`) is
not a faithful port of Rails'
`test_raises_type_mismatch_with_namespaced_class`
(`vendor/rails/activerecord/test/cases/associations/belongs_to_associations_test.rb:266-283`).

Rails dynamically defines `Admin::RegionalUser` with `belongs_to(:region)` (NO
explicit `class_name`) plus `Admin::Region`, and an `admin_regions` table, then
asserts the wrong-type assignment raises `AssociationTypeMismatch`. The point of
the test is that the association class is resolved **namespace-relative** —
`region` → `Admin::Region` — via Ruby constant nesting.

The trails port instead uses the canonical `AdminUser.belongsTo("account",
{ className: "AdminAccount" })`, which carries an **explicit** `className`. That
bypasses namespace-relative resolution entirely: trails' name convention would
otherwise resolve `account` → top-level `Account`, not `Admin::Account`. The
test still exercises this PR's behavior (the message assertion proves `klass`
resolved to the namespaced class and the guard fired), but it does NOT cover the
convention-based namespace walk Rails' test targets.

Root gap: trails' association `klass` getter (`associations/association.ts:330`)
and `computeType` (`inheritance.ts:45`) do not do Ruby-style namespace-relative
constant lookup — they are bare `modelRegistry.get`. See sibling
`compute-type-namespace-relative-resolution` (RFC 0030, done, PR #3975) which
notes the same `computeType` no-op.

## Acceptance criteria

- Trails resolves a namespaced `belongs_to` target class by module-relative
  convention (e.g. `Admin::User` `belongs_to :account` → `Admin::Account`
  without an explicit `className`), mirroring Rails `compute_type`.
- The `raises type mismatch with namespaced class` test is a faithful port: a
  namespaced owner with a convention-resolved (no explicit `className`)
  `belongs_to`, asserting `AssociationTypeMismatch` on wrong-type assignment.
- Canonical `TEST_SCHEMA` carries any table the faithful port needs (mirror
  Rails' `admin_regions` shape), or the port reuses an existing canonical
  namespaced pair — no bespoke tables.

## Notes

- Likely depends on / overlaps the `computeType` namespace-relative resolution
  work; check for an active story before implementing.
- The `AdminUser` model's explicit `className: "AdminAccount"` exists precisely
  because convention resolution is missing; dropping it is part of the fix.
