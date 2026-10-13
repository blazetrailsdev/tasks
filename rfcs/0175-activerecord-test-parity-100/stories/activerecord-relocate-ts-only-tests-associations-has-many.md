---
title: "activerecord: move the 7 TS-only tests in has-many-associations.test.ts to a .trails sibling"
status: in-progress
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 380
priority: null
pr: trails#8854
claim: "2026-10-13T12:42:25Z"
assignee: "activerecord-delegation-records-test-array-respond-to"
blocked-by: null
closed-reason: null
---

## Context

TS-only tests left in `packages/activerecord/src/associations/has-many-associations.test.ts` (7 extras, about 176 lines):

- `adding buffers a record whose save fails into the target`
- `creating a record whose save fails buffers it into the target`
- `deleting composite-key records scopes by tuple, not cartesian product`
- `destroy returns the removed records`
- `depends and nullify with composite foreign key nulls every fk column` (a pending `it.skip`)
- `isAssociationCached reflects built association instances`
- `collection destroy uses destroy bang and rolls back the batch on failure`

The Rails file is `vendor/rails/v8.0.2/activerecord/test/cases/associations/has_many_associations_test.rb`; `has-many-association.trails.test.ts` already exists beside it under the singular name, so decide whether the sibling is that file or a new `has-many-associations.trails.test.ts`.

## Acceptance criteria

- [ ] Each extra is (a) a Rails test under a drifted name or describe path, matched to the Rails name/path (never renaming a Rails-named test); (b) a duplicate of a ported Rails test, deleted; or (c) genuinely TS-only, moved to the `.trails.test.ts` sibling.
- [ ] A moved test carries no `any`: a new `.trails.test.ts` file is not in `eslint/no-explicit-any-test-exclude.json`, and no entry is added there.
- [ ] The files above report 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```

## Notes

Remainder of `activerecord-relocate-ts-only-tests-associations`, whose first
PR zeroed `callbacks`, `belongs-to-associations`, `cascaded-eager-loading`,
`inverse-associations` and `required`. A move costs about 2.2x the moved lines
in diff (deletion, addition, sibling setup), and a new sibling is held to
`no-explicit-any`, `blazetrails/no-standalone-associations` and
`blazetrails/prefer-await-relation`, so the tests are retyped, not copied.
`parity:test` prints only counts; to list the unconsumed tests, print
`tsTests[i].path` for every `i` not in `consumedTs` beside the `extra`
computation in `scripts/test-compare/compare.ts`.
