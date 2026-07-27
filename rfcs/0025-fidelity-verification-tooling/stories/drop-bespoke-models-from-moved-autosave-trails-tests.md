---
title: "drop-bespoke-models-from-moved-autosave-trails-tests"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5302 relocated eight Rails-less autosave tests out of the Rails-named
describes in `packages/activerecord/src/autosave-association.test.ts` into
`packages/activerecord/src/autosave-association.trails.test.ts` (bodies copied
verbatim, no behavior change).

Five of the moved tests — now in the `TestAutosaveAssociationsInGeneral` describe
of `packages/activerecord/src/autosave-association.trails.test.ts` — still declare
bespoke inline model classes rather than using the canonical models:

- `custom validation context is applied to unchanged persisted children`
  (`Widget` / `WidgetOwner` on `books` / `authors`)
- `default belongs_to saves new associated record and propagates the FK`
  (`Author` / `Post` on `authors` / `books`)
- `belongs_to autosave with mismatched composite FK/PK uses zip semantics`
  (`Parent` / `Child` on `authors` / `topics`)
- `default belongs_to runs validations on the new target via validate: !autosave`
  (`Author` / `Post` on `authors` / `books`)
- `belongs_to autosave with PK longer than FK skips trailing PK positions`
  (`Parent` / `Child` on `authors` / `books`)

The tables are canonical, but the models are invented, and two of them need a
`no-standalone-associations-exclude.json` allowlist entry
(`...trails.test.ts::Post::belongsTo::author`,
`...trails.test.ts::Child::belongsTo::parent`) precisely because the classes are
redeclared per-test. Canonical models live in
`packages/activerecord/src/test-helpers/models/` (e.g. `author.ts`, `post.ts`,
`topic.ts`); Rails' equivalents are in `vendor/rails/activerecord/test/models/`.

Two of these tests (the zip-semantics and PK-longer-than-FK pair) exercise
deliberately misconfigured composite FK/PK pairings, so they may genuinely need
ad-hoc associations rather than canonical ones — decide per test rather than
forcing all five.

## Acceptance criteria

- Each of the five tests either uses canonical models/associations, or carries a
  call-site comment justifying why an ad-hoc class is required (misconfiguration
  that no canonical model can express).
- Test names stay verbatim — do not rename.
- Any `no-standalone-associations-exclude.json` entry that becomes unnecessary is
  removed; no new entries are added.
- `pnpm vitest run packages/activerecord/src/autosave-association.trails.test.ts`
  passes.
