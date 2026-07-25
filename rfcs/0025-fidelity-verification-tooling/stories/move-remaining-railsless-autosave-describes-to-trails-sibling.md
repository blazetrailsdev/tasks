---
title: "Move the 3 Rails-less autosave describes (13 tests) to the trails sibling file"
status: draft
updated: 2026-07-25
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while doing the Rails-less-test relocation in PR #5302
(`move-slot-b-proxy-build-test-to-trails-sibling-file`). That PR moved the 8
Rails-less tests that sat inside Rails-_named_ describes. Three describes in
`packages/activerecord/src/autosave-association.test.ts` have no Rails class at
all and were left in place as out of scope:

- `ChangedForAutosaveTest` (3 tests) — no `class ChangedForAutosaveTest` exists
  anywhere under `vendor/rails/activerecord/test/cases/`
- `autosaveHasOne queryConstraints PK/FK pairing` (3 tests)
- `computePrimaryKey` (7 tests)

All 13 are TS-only. The repo convention is that TS-only extras live in the
sibling `packages/activerecord/src/autosave-association.trails.test.ts` (created
by #5302), keeping the Rails-convention file a 1:1 mirror of
`vendor/rails/activerecord/test/cases/autosave_association_test.rb`.

Note the plain-language describe names (`autosaveHasOne queryConstraints PK/FK
pairing`, `computePrimaryKey`) — these are unit tests of trails internals
(`packages/activerecord/src/autosave-association.ts`), which is exactly what the
trails sibling file is for.

## Acceptance criteria

- All three describes live in `autosave-association.trails.test.ts`; bodies and
  comments move verbatim (no behavior/assertion changes).
- Test names unchanged.
- Any `eslint/*-exclude.json` entry made stale by the move is removed; new
  entries only where the moved code genuinely needs them.
- `pnpm test:compare` shows `extra` on `autosave_association_test.rb` dropping by
  13 with matched/missing/misplaced unchanged.
- Both `autosave-association.test.ts` and `autosave-association.trails.test.ts`
  pass.
