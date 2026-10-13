---
title: "activerecord: move the 22 TS-only tests in autosave-association.test.ts to its .trails sibling"
status: claimed
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: "2026-10-13T17:54:06Z"
assignee: "activerecord-relocate-ts-only-tests-autosave-association"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/autosave-association.test.ts` holds 22 extras against
`vendor/rails/v8.0.2/activerecord/test/cases/autosave_association_test.rb`:

- 6 in `TestHasManyAutosaveAssociationWhichItselfHasAutosaveAssociations` (`autosave-association.test.ts:2359`) and 3 in `TestHasOneAutosaveAssociationWhichItselfHasAutosaveAssociations` (`:2529`). Rails generates those two classes' tests from the `AutosaveAssociationOnACollectionAssociationTests` style modules, so check each name against the Rails file before calling it TS-only: a drifted name is renamed to Rails', not moved.
- 3 in `ChangedForAutosaveTest` (`:3303-3391`), 3 in `autosaveHasOne queryConstraints PK/FK pairing` (`:3393-3540`) and 7 in `computePrimaryKey` (`:3542-3617`). None of the three describes is a Rails class; about 315 lines.

`autosave-association.trails.test.ts` already exists and receives the TS-only ones.

Split out of `activerecord-relocate-ts-only-tests-root-part-1`, whose six files moved far more lines than its
650 LOC estimate (a moved test counts once as a deletion and once as an addition). That story shipped
`relation.test.ts`, `attributes.test.ts` and the five TS-only tests of `relations.test.ts`.

`pnpm parity:test` has no flag that lists a file's extras. To list them, print the unconsumed entries of `tsTests`
next to `const extra = tsTests.length - consumedTs.size` in `scripts/test-compare/compare.ts` locally (do not
commit it).

`eslint/no-explicit-any-test-exclude.json` exempts the Rails-named file but not a new `.trails.test.ts`
sibling, and that list is only-shrink: remove each `as any` in a moved test instead of adding a row.

## Acceptance criteria

- [ ] Each extra is (a) a Rails test under a drifted name or describe path, matched to Rails' (never renaming a Rails-named test), (b) a duplicate of a ported Rails test, deleted, or (c) TS-only, moved to `autosave-association.trails.test.ts`.
- [ ] `autosave_association_test.rb` reports 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
