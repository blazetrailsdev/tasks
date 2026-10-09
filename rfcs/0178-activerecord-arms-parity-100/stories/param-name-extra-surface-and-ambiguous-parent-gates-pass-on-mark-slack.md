---
title: "parity: param-name, extra-surface and ambiguous-parent gates pass with a mark above the measurement"
status: draft
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8718 made `pnpm parity:api:arms:throws` and `pnpm parity:api:blocks` exit non-zero when a
mark sits above the measurement, through `staleMarkFailure` in
`scripts/api-compare/param-name-mark.ts`. Three sibling only-shrink gates still print an
"is above the current" note for the same condition and exit 0, so a regression of up to the
slack passes:

- `scripts/api-compare/lint-param-names.ts` (`pnpm parity:api:params`, mark
  `param-name-mark.json`), the `for (const v of stale)` loop after the `grew` arm.
- `scripts/api-compare/lint-extra-surface-ratchet.ts` (`pnpm parity:api:extra:gate`, mark
  `extra-surface-mark.json`), same loop.
- `scripts/api-compare/lint-ambiguous-parents.ts` (`pnpm parity:api:parents`), same loop.

`pnpm parity:api:calls` already reds on a stale high-water mark
(`scripts/api-compare/lint-call-mismatches.ts`).

## Acceptance criteria

- [ ] Each of the three gates exits non-zero when any mark dimension is above the current
      measurement, naming the row and its `:tighten` script. `staleMarkFailure` is reused where
      the mark shape fits.
- [ ] Each gate's test under `scripts/api-compare/` covers the stale-mark arm.
- [ ] All three are green on main after the change (tighten first if slack exists).
