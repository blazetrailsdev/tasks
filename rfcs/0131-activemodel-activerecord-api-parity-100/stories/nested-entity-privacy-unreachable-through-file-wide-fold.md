---
title: "A nested Rails entity's private member cannot carry @internal when a sibling entity publishes the name"
status: in-progress
updated: 2026-09-04
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 7
pr: 7471
claim: "2026-09-04T01:40:32Z"
assignee: "nested-entity-privacy-unreachable-through-file-wide-fold"
blocked-by: null
closed-reason: null
---

## Context

`LoaderRecords` (`packages/activerecord/src/associations/preloader/association.ts`)
cannot carry `@internal` on two members that Rails declares private, because
the manifest's file-wide fold sees the same names published by a sibling entity
in the same `.rb`:

- `LoaderRecords#load_records` is private
  (`vendor/rails/activerecord/lib/active_record/associations/preloader/association.rb:91`,
  under the `private` at `:75`), but `Association#load_records` is public in the
  same file (`:197`).
- `LoaderRecords#loader_query` comes from the private `attr_reader` at `:76`,
  but `Association#loader_query` is public at `:165`.

`scripts/build-rails-privates-manifest.ts:49-52` folds visibility per FILE on
purpose — a name any entity publishes is not-private file-wide — to avoid PR #7057's over-tagging. The consequence for the reverse rule
(`blazetrails/unbacked-internal-needs-receipt`, RFC 0121) is the opposite
failure: tagging either member errors with

```text
`loadRecords` is tagged `@internal` but has no Rails-private counterpart in this file …
```

and the rule's only escape hatch is a `@noRailsEquivalent PERMANENT|CONVERGEABLE`
receipt, which would be a false claim — both names DO have a Rails counterpart,
private on the entity that owns the TS declaration.

So the two members ship public in trails where Rails has them private, and the
nested class's privacy cannot be expressed at all. Surfaced in PR #7434
(`port-preloader-loader-records`), where the four members unique to
`LoaderRecords` (`keysToLoad`, `alreadyLoadedRecordsByKey`,
`populateKeysToLoadAndAlreadyLoadedRecords`, `alreadyLoadedRecords`) are tagged
and these two are not.

The manifest already carries what is needed: `entities` — the per-TS-file map of
contributing Ruby entities (`build-rails-privates-manifest.ts:30-35`, built from
`scripts/api-compare/privates-entities.ts`).

## Converged shape

A member declared inside a TS class that maps to a nested Ruby entity is judged
against THAT entity's visibility, not the file-wide fold: `LoaderRecords`'
`loadRecords` and `loaderQuery` resolve private via `entities`, so `@internal` on
them is backed and required, while `Association`'s own `loadRecords` /
`loaderQuery` stay public and untagged. The file-wide `files` union keeps its
current role for members whose owning entity cannot be resolved, so PR #7057's
over-tagging stays fixed.

Then add `@internal` to `LoaderRecords#loaderQuery` and `LoaderRecords#loadRecords`
in `packages/activerecord/src/associations/preloader/association.ts`.

## Acceptance criteria

- `blazetrails/unbacked-internal-needs-receipt` and `blazetrails/rails-private-jsdoc`
  consult the owning entity for a member of a nested class before falling back to
  the file-wide fold.
- `LoaderRecords#loaderQuery` and `LoaderRecords#loadRecords` carry `@internal`
  with no `@noRailsEquivalent` receipt and no lint error.
- No new over-tagging: `Association#loadRecords` / `Association#loaderQuery` and
  the `rack` `Mutex#unlock` case from PR #7057 stay untagged.
- `pnpm parity:api:extra:gate` stays green (activerecord marks only shrink).
