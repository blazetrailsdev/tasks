---
title: "Port the six missing autosave add-callback and habtm callback cases"
status: in-progress
updated: 2026-08-30
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 7264
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The last six genuinely-missing ActiveRecord test names. As of 2026-08-30 (after
PR #7253 landed the migration cluster) activerecord sits at 8360/8372 (99.9%),
345/345 files. The 12-test gap is really **6 real + 6 tooling false positives**;
the false positives are `dynamic-title-tests-are-counted-extra-never-matched`
and are NOT in scope here.

The six real ones are all in `autosave_association_test.rb`, all in the
`before_add` / `after_add` / `before_remove` / `after_remove` collection-callback
family:

- `should run add callback methods for has many`
- `should run add callback procs for has many`
- `should run add callback methods for habtm`
- `should run add callback procs for habtm`
- `should run remove callback methods for habtm`
- `should run remove callback procs for habtm`

trails has exactly one of the four describes:
`packages/activerecord/src/autosave-association.test.ts:4646`,
`describe("TestAutosaveAssociationOnACollectionRemoveCallbacks")`, whose
`for (const callbackType of ["method", "proc"])` loop at `:4654` covers
**remove / has_many only**. There is no add-callback describe and no habtm
counterpart of either.

The two remove/has_many cases already exist and pass; they read as `Missing`
in `parity:test` only because their `it()` titles interpolate `${callbackType}`.
Do not re-port them.

## Acceptance criteria

- The six named tests exist with Rails' names verbatim, under the Rails
  describe names from `vendor/rails/activerecord/test/cases/autosave_association_test.rb`.
- Canonical models and fixtures only — the existing describe already uses
  `CanonicalPirate` / `CanonicalBird`; the habtm cases follow Rails' own models
  rather than inventing a join table.
- `pnpm parity:test --package activerecord` reports 0 Missing for
  `autosave_association_test.rb`.
- The existing interpolated remove/has_many cases are left alone.
