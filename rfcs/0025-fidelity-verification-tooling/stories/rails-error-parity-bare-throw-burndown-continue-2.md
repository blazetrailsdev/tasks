---
title: "rails-error-parity-bare-throw-burndown-continue-2"
status: in-progress
updated: 2026-06-22
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 20
pr: 3916
claim: "2026-06-22T19:31:17Z"
assignee: "rails-error-parity-bare-throw-burndown-continue-2"
blocked-by: null
---

## Context

Continues the `blazetrails/rails-error-parity` bare-throw burndown (RFC 0025),
following PR #3250 and PR #3374. The ratchet baseline
`eslint/rails-error-parity-exclude.json` still lists ~170 files across
`activemodel`, `activerecord`, and `activesupport`. Each bare `throw new
Error(...)` / `throw new TypeError(...)` in those files must be replaced with the
correct ported Rails error class, then the file removed from the exclude list
(the ratchet only shrinks).

PR #3374 converted the three pure-`ArgumentError` ActiveModel validators
(`comparison.ts`, `format.ts`, `length.ts`). The immediate next slice is the
remaining `activemodel/src/validations/` files, which need **ported Ruby base
classes that do not yet exist**:

- `clusivity.ts` — two sites are `ArgumentError`; one (`isMemberOf` nil guard)
  mirrors Ruby `nil.include?` → needs a ported **`NoMethodError`** root class.
- `numericality.ts` — `:option must be a number/range` sites are `ArgumentError`;
  the `option_as_number` Kernel.Float guards split between `TypeError`
  (non-Numeric/non-String input) and `ArgumentError` (bad strings) → needs a
  ported **`TypeError`** root class.
- `with.ts` — TS-specific guards (no direct Rails `raise`); decide the closest
  faithful class (likely `NoMethodError` for the missing-method guard).

Port the missing Ruby base classes first (rooted per the rule's `ROOT_BASES`,
extending a global Error type), regenerate the manifest
(`pnpm tsx scripts/build-rails-error-manifest.ts`), then convert the throws.
Read the Rails source for each site — do not invent classes or pick a near-miss.

## Acceptance criteria

- [ ] A coherent slice of files is removed from
      `eslint/rails-error-parity-exclude.json`, with every banned bare throw in
      them replaced by the correct ported error class.
- [ ] Any Ruby base class a converted site requires but that is missing
      (`NoMethodError`, `TypeError`, …) is ported into the appropriate
      `errors.ts` with the manifest-correct parent, and the manifest regenerated.
- [ ] `pnpm lint` passes with the shrunken baseline (rule stays `error`); the
      baseline is strictly smaller and never grew.
- [ ] Touched packages' affected test files stay green; api:compare /
      test:compare delta non-negative.
- [ ] PR diff under the 500 LOC ceiling; remaining files registered as a further
      continuation story.
