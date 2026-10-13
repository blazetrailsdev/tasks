---
title: "activerecord: move the 19 TS-only tests in join-model, eager and has-one-associations test files to .trails siblings"
status: ready
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 550
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

TS-only tests left in Rails-named association test files (extras per file, all under `packages/activerecord/src/associations/`):

- `join-model.test.ts`: 5. `has many polymorphic with source type merges source reflection scope`, `eager has many polymorphic with source type merges source reflection scope`, `eager has many through uses conditions specified on the has many association`, `polymorphic has many through with composite owner primary key`, `through association with scope with string joins`. The file-level classes `WelcomeOnlyTagging` and `ScopedSourceTag` are used only by the first two and move with them.
- `eager.test.ts`: 6. `eager association loading with explicit join belongs to`, `... has one`, `... marks empty association loaded`, `... habtm`, `eager association loading with habtm via preload`, `joins with multiple includes should preload via joins`. Rails has one `test_eager_association_loading_with_explicit_join` (`vendor/rails/v8.0.2/activerecord/test/cases/associations/eager_test.rb:588`), already matched.
- `has-one-associations.test.ts`: 8. `direct destroy records destroyed account id via unloaded belongs_to`, `direct destroy only preloads the belongs_to the callback references`, four `create over a(n) (un)loaded target ...`, `create re-raises a deferred target-load error after a successful build`, `build over a loaded target nullifies the prior account`. Compare the `create over ...` ones against `test_creation_failure_replaces_existing_with(out)_dependent_option` (`has_one_associations_test.rb:538,552`) before moving: a duplicate is deleted.

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
