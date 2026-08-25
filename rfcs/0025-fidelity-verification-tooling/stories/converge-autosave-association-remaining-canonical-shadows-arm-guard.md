---
title: "converge-autosave-association-remaining-canonical-shadows-arm-guard"
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

Final pass of `converge-autosave-association-bespoke-registermodel-canonical-shadows`.

`packages/activerecord/src/autosave-association.test.ts` registers bespoke
classes under canonical **Company / Client / Customer / Order / Person /
Reference / Widget / Owner / Profile / User** names, which the `registerModel`
canonical-shadow guard (`packages/activerecord/src/associations.ts` —
`guardCanonicalNameShadow`) rejects.

Sites (line numbers as of the pass-1 commit): 519/520 Company+Client,
1957/1958 Customer+Order, 2584/2585, 2640/2641, 2751/2752 Person+Reference,
2798/2799 Widget+Owner, 2880/2881, 3138/3139, 3812/3813 Profile+User.

Rails source: `vendor/rails/activerecord/test/cases/autosave_association_test.rb`
plus the matching `vendor/rails/activerecord/test/models/`.

## Acceptance criteria

- Each listed site uses the canonical model (read the corresponding Rails test
  first; do NOT rename tests), or a distinct non-canonical name where no
  canonical model fits.
- Once no collision remains in the file, it imports
  `./test-helpers/canonical-model-index.js` so the guard is armed and green
  (this is the last pass — depends on passes 2 and 3 having landed).
- Existing tests stay green.
- LOC ceiling; single PR from `main`, no stacking.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
