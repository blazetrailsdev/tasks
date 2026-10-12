---
title: "activerecord: move the 20 TS-only tests in the has-many-through and has-one-through test files to .trails siblings"
status: draft
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 690
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

TS-only tests left in Rails-named association test files (extras per file, all under `packages/activerecord/src/associations/`):

- `has-many-through-associations.test.ts`: 10. `associating a persisted record with unsaved changes saves those changes`, `pushing a persisted record with unsaved changes saves those changes`, `appends a composite-pk target record through a join model`, three `composite ... has_many through routes via join scope`, `collection singular ids getter through with custom primary key`, `through association resolves composite source association primary key`, `insertRecord with validate false still raises on invalid join record`, `loads through a join model`.
- `has-one-through-associations.test.ts`: 10, all about building or creating over an existing join row (`building with a loaded join row preserves unrelated in-memory changes on it` through `re-assigning the same target record on a persisted owner is a no-op`).

`collection singular ids getter through with custom primary key` sits next to Rails `test_collection_singular_ids_getter_with_string_primary_keys` (`vendor/rails/v8.0.2/activerecord/test/cases/associations/has_many_through_associations_test.rb:1019`); check it is not that test under a drifted name.

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
