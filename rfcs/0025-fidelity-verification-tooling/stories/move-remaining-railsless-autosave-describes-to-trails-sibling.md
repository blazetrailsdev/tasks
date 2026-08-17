---
title: "Move the 3 Rails-less autosave describes (13 tests) to the trails sibling file"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
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
- `pnpm parity:test` shows `extra` on `autosave_association_test.rb` dropping by
  13 with matched/missing/misplaced unchanged.
- Both `autosave-association.test.ts` and `autosave-association.trails.test.ts`
  pass.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
