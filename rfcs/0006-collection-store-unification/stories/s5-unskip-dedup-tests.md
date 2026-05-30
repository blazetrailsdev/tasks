---
id: S5
rfc: "0008-collection-store-unification"
title: "Unskip inverse-dedup tests gated on the removed seam"
status: draft
cluster: associations
deps: [S4]
est_loc: 80
---

# S5 — Unskip inverse-dedup tests gated on the removed seam

## Goal

With the two stores unified and the hand-glued sync seam removed, flip the
skipped inverse-dedup tests in `inverse-associations.test.ts` to active. This is
the proof that the unification actually closed the gap those tests document.

## Acceptance

- The previously-skipped inverse-dedup tests run and pass; no test renames.
- No production code change beyond what is needed to make the tests pass (if
  any is needed, it belongs in S2–S4, not here).
- `api:compare` delta non-negative.

## Notes

Optional / gating story — if S2–S4 already unskipped these as part of proving
their own acceptance, fold this in and mark done. Otherwise it stands alone as
the final flip.
