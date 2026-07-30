---
title: "Only-shrink counter for unreviewed default-reason entries"
status: done
updated: 2026-07-30
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: ["wide-ratchet-report-and-grouping"]
deps-rfc: []
est-loc: 150
priority: 2
pr: 5661
claim: "2026-07-30T19:17:20Z"
assignee: "wide-ratchet-unreviewed-reason-counter"
blocked-by: null
closed-reason: null
---

## Context

4445 of 4794 wide-ratchet baseline entries (92.7%) still carry the verbatim
`DEFAULT_REASON` seed string from `lint-call-mismatches-wide.ts:96-98` — they
were bulk-seeded when the ratchet landed and have never been looked at. The
existing only-shrink ratchet counts entries, so an agent that reviews an entry
and writes a real reason for it makes no measurable progress.

A second only-shrink counter on unreviewed entries gives the burn-down a target
that moves when review happens, not only when code converges.

## Acceptance criteria

- The gate fails when the number of entries carrying `DEFAULT_REASON` exceeds a
  committed high-water mark.
- The mark lives in a small committed file (or a constant) and is lowered by
  `--write`, never raised.
- A newly-seeded entry (a genuinely new mismatch added to the baseline with the
  default reason) is reported distinctly from the pre-existing 4445, so the
  counter cannot be gamed by reseeding.
- Depends on the `--report` bucketing from
  `wide-ratchet-report-and-grouping` for the count itself.
- Expected row delta: 0 (this measures, it does not remove).
