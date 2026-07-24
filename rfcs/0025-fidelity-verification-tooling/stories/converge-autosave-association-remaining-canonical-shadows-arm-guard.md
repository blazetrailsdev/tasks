---
title: "converge-autosave-association-remaining-canonical-shadows-arm-guard"
status: blocked
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-24T18:22:53Z"
assignee: "converge-autosave-association-remaining-canonical-shadows-arm-guard"
blocked-by: "Blocked on PR #5248 (pass 1, converge-autosave-association-bespoke-registermodel-canonical-shadows, still open) which rewrites the same file; also arming the guard today surfaces 13 canonical-name collisions (Pirate/Company/Author/Firm/User/Person/Customer/Book/Ship/Eye/Parrot/Owner/Comment) across 97 failing tests — far beyond the 500 LOC ceiling for one PR. Needs the intermediate passes registered and merged first."
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
- 500 LOC ceiling; single PR from `main`, no stacking.
