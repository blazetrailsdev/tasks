---
title: "Lift the assertion-mark freeze and reseed once"
status: done
updated: 2026-09-25
rfc: "0123-blocked-convergence-holding"
cluster: enforcement
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 40
priority: 10
pr: trails#8074
claim: "2026-09-25T00:49:11Z"
assignee: "tighten-assertion-mark-after-0132"
blocked-by: null
closed-reason: null
---

## Context

The assertion-mismatch mark is frozen for the duration of this RFC by
`scripts/test-compare/assertion-mismatch-mark.freeze` (see the RFC README's
"Constraints every story here inherits"). Every other story here converges
assertions and writes nothing to
`scripts/test-compare/assertion-mismatch-mark.json`, because all of them land in
the same handful of package rows and a per-story write serializes the RFC on
three integers.

That is green the whole way — `main` in
`scripts/test-compare/lint-assertion-mismatches.ts` fails only on `exceeded`
(current > mark), `unmarked` and `missing`, and has no staleness arm, so a mark
carrying slack passes — but it means the ratchet stops guarding the ground
already converged. This story is what ends that window.

The `--write` arm is refused while the marker exists (`loadFreeze` /
`renderFrozen` in `scripts/test-compare/assertion-ratchet.ts`), so deleting the
marker is a required step, not a cleanup.

## Acceptance criteria

- Every other story in RFC 0132 is `done` or `closed`. This story runs last;
  claiming it while a sibling is still open reseeds against an unfinished
  measurement and burns the one cheap pass.
- `scripts/test-compare/assertion-mismatch-mark.freeze` is deleted.
- `pnpm parity:test:assertions:reseed` is run once, from a FULL comparison (no
  `--package` filter — a partial-scope run is refused by the `missing` arm, and
  a scoped artifact would understate the packages it omits).
- The resulting `assertion-mismatch-mark.json` diff is reviewed row by row: each
  package's three counters fall to its measured value, and no counter rises.
  Rows for packages outside this RFC move only if a sibling PR genuinely
  converged them — call out any such row in the PR body, since the freeze was
  put there precisely to keep unreviewed cross-package tightening out.
- The RFC's End condition holds: the eight named packages read `0 / 0 / 0`.
- `pnpm parity:test:assertions` is green after the reseed.
- The freeze paragraphs in the RFC README and in `CONTRIBUTING.md`
  ("Measuring progress") are updated to past tense or removed; the
  `loadFreeze` / `renderFrozen` machinery STAYS — it is the reusable interlock,
  not RFC 0132 scaffolding.

## LOC limit

Standard. The mark diff is generated and does not count.
