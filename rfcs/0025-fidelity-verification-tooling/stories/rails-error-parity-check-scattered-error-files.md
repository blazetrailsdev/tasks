---
title: "rails-error-parity: check scattered (non-errors.ts) error-class files"
status: in-progress
updated: 2026-06-15
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 3375
claim: "2026-06-15T16:54:25Z"
assignee: "rails-error-parity-check-scattered-error-files"
blocked-by: null
---

## Context

The `rails-error-parity` ESLint rule gates its class-hierarchy parity check
(`missingClass`/`wrongParent`/`rootExtends`) to files named `errors.ts` only
(see `isErrorsFile` in `eslint/rails-error-parity.mjs`). This works for
activerecord/activemodel, which concentrate error classes in `errors.rb`, but
ActiveSupport scatters error classes across many files (`delegation.rb`,
`concern.rb`, `notifications/fanout.rb`, `actionable_error.rb`,
`core_ext/string/output_safety.rb`, etc.). After the activesupport scope
widening (#3251), the parity portion of the rule therefore checks nothing for
activesupport — only the bare-throw ban is enforced there.

Generalize the parity check to run on any in-scope file that has manifest
error classes mapped to it (collect `exportedClasses` on all files, not just
`errors.ts`; drop the `isErrorsFile` gate around `checkParity`). This will
also surface new violations in activerecord/activemodel non-`errors.ts` files,
so expect to extend the ratchet baseline accordingly.

## Acceptance criteria

- `checkParity` runs on every in-scope file, matching manifest entries whose
  mapped `srcRel` equals the file (not just `errors.ts`).
- Pre-existing violators (AR/AM/AS) grandfathered in
  `eslint/rails-error-parity-exclude.json`.
- Tests cover a scattered (non-`errors.ts`) error-class file in scope.
