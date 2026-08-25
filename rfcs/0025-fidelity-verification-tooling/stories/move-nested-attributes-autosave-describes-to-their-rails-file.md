---
title: "Move the two nested_attributes_test.rb autosave describes out of autosave-association.test.ts"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while doing the Rails-less-test relocation in PR #5302
(`move-slot-b-proxy-build-test-to-trails-sibling-file`).

`packages/activerecord/src/autosave-association.test.ts` contains two describes
whose Rails class actually lives in a _different_ Rails file:

- `TestHasOneAutosaveAssociationWhichItselfHasAutosaveAssociations` (3 TS-only
  tests) — Rails:
  `vendor/rails/activerecord/test/cases/nested_attributes_test.rb:1049`
- `TestHasManyAutosaveAssociationWhichItselfHasAutosaveAssociations` (6 TS-only
  tests) — Rails:
  `vendor/rails/activerecord/test/cases/nested_attributes_test.rb:1089`

Because the convention TS file for `autosave_association_test.rb` is
`autosave-association.test.ts`, those describes are compared against the wrong
Rails file: their tests count as `extra` there and their real Rails counterparts
are invisible. The convention file for `nested_attributes_test.rb` is
`packages/activerecord/src/nested-attributes.test.ts`.

Re-derive the per-test verdict after moving — some of the 9 may in fact match
real Rails tests in `nested_attributes_test.rb` once they are compared against
the right file, in which case they are ports rather than TS-only extras and
their names must be checked against Rails verbatim.

## Acceptance criteria

- Both describes live in the file whose Rails counterpart declares their class
  (`nested-attributes.test.ts`), or, for the tests that have no Rails
  counterpart there, in the corresponding `*.trails.test.ts` sibling.
- Test names unchanged (no renames) — any mismatch is fixed in the
  implementation, not the name.
- `pnpm parity:test` shows the affected describes attributed to
  `nested_attributes_test.rb`, with `extra` on `autosave_association_test.rb`
  reduced by the moved count and no new `missing` / `misplaced`.
- Touched test files pass.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
