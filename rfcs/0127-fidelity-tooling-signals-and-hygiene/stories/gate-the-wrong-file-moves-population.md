---
title: "parity:api:moves computes 1413 misplaced methods and gates none of them: add an only-shrink moves ratchet and enrol arel at 3"
status: draft
updated: 2026-08-31
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while answering a review question on PR #7283 (tagged-only mode for
the extra-surface ratchet). The PR initially justified dropping the `total`
dimension by claiming another mechanism policed names that live in the wrong
file. It does not, and neither does anything else:

- `blazetrails/rails-file-structure-method-order` orders members **within one
  file's container** and "filters expected names to those present in that
  container" (`eslint/rails-file-structure-method-order.mjs`), so a name Rails
  defines in a different `.rb` never enters the bucket — it rides along in the
  unmapped tail. It cannot see a cross-file relocation.
- `scripts/api-compare/moves.ts` (`pnpm parity:api:moves`) is the tool that DOES
  compute the population — "methods that are matched via include chain but live
  in the wrong file", grouped source → destination. But it is a **plan
  generator, not a gate**: its only `process.exit(1)` calls are for a bad
  `--package` flag and a missing `api-comparison.json`. It prints and exits 0 on
  any population size, and it appears nowhere in `.github/workflows/ci.yml`.

So the count can grow indefinitely and no CI job notices. Measured 2026-08-31
off a forced `pnpm parity:api`:

| Methods to relocate | Package |
| --- | --- |
| 840 | activerecord |
| 202 | activesupport |
| 109 | actioncontroller |
| 103 | activemodel |
| 77 | actionview |
| 57 | actiondispatch |
| 19 | trailties |
| 3 | arel |
| 3 | abstractcontroller |

This is a distinct population from the extra-surface `total` dimension.
`total`'s moved-not-novel slice counts a name that is EXTRA in its TS file
while Rails defines it elsewhere; `moves.ts` counts a name that is correctly
MATCHED but sited in the wrong file. `total` gates the first (per gated
package); nothing gates the second, for any package.

`arel` at 3 is the natural first enrollment, exactly as it was for RFC 0117's
extra-surface mark and RFC 0126's parameter-name mark — it is already near zero,
so the mark is meaningful immediately and the burndown is three names.

## Acceptance criteria

- A `moves-mark.json` + only-shrink ratchet in the shape the repo already uses
  three times (`extra-surface-mark.ts`, `param-name-mark.ts`, the call-set
  baseline): a committed per-package count, CI fails on ANY increase, a
  `:tighten` that writes DOWN only, and no reseed.
- `arel` is enrolled at its measured 3. Every other package is measured and
  reported but ungated, and `GATED_PACKAGES` widening stays a separate decision
  with its own burndown story — do not enrol activerecord's 840 here.
- A CI step runs it in the `rails-comparison` job beside the other three
  ratchets, with a comment in the same register explaining what a red run means
  and that the fix is to move the method, never to raise the mark.
- Unit tests beside the module for exceedance, stale-mark reporting, tighten
  monotonicity and the unmeasured/unmarked guards — the contract the sibling
  marks' tests already pin.
- The three arel names are either relocated in this story or carry a filed
  follow-up; enrolling at 3 with no plan to reach 0 is not the point.
