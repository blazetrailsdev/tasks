---
title: "Flip the assertion-mismatch gate from ratchet to hard zero"
status: draft
updated: 2026-08-13
rfc: "0000-ar-deps-test-parity-100"
cluster: enforcement
packages:
  - "activerecord"
  - "activesupport"
deps:
  - "widen-assertion-report-packages-and-seed-mark"
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Assertion mismatches are report-only today: `scripts/test-compare/compare.ts:606-663`
records them, nothing fails on them, and RFC 0025's ratchet
(`scripts/test-compare/assertion-mismatch-mark.json`, PR #5790,
`pnpm parity:test:assertions`) only guarantees the debt never grows. A number
that only counts when someone reads the report is the same problem as an
exclusion nobody revisits — which is why the RFC's "Done means" requires the
flip, not just the burn.

The precedent is in the same file: gate-mismatch went advisory → ratchet → hard
zero, and now `enforceGateZero` (`compare.ts:150-181`, `GATE_ENFORCED_PACKAGES`
at `:82`) exits non-zero with no baseline at all. This story does the same for
the three assertion axes, once every in-scope package reads 0/0/0 — it is the
last story in the RFC and is gated on all the `assertions-*` stories plus the
widened packages' burndown.

## Acceptance criteria

- `pnpm parity:test -- --check` fails when any package in the in-scope closure
  reports a non-zero assertion-count, assertion-kind or assertion-value
  mismatch, with no baseline or mark to absorb it.
- `scripts/test-compare/assertion-mismatch-mark.json` is deleted (or reduced to
  the packages still outside the enforced set), and
  `pnpm parity:test:assertions` / `:reseed` are retired or re-pointed — no
  vestigial ratchet left next to a hard gate.
- The enforced package set is explicit and named in code the way
  `GATE_ENFORCED_PACKAGES` is, with the out-of-scope packages (actionview,
  trailties, actioncontroller, actiondispatch) still report-only.
- CI is green on the flip, which is only true if every burndown story has
  landed — do not claim this story before then.
