---
rfc: "0099-call-argument-convergence"
title: "Call-argument convergence burndown"
status: draft
created: 2026-08-10
updated: 2026-08-10
owner: "@deanmarano"
packages:
  - "activerecord"
  - "arel"
clusters:
  - "api-compare"
related-rfcs:
  - "0095-call-argument-parity"
  - "0096-naming-identifier-burndown"
  - "0084-call-set-parity-burndown"
---

## Summary

Burn down the call-argument divergences that RFC 0095's tooling now measures:
ported bodies that call what Rails calls, with a different argument count,
order, literal value or kwarg key. RFC 0095 built the extractor, the
normalizer, the artifact and the only-shrink ratchet; this RFC owns the
_convergence_ — the code edits that delete `kind: "args"` rows from
`scripts/api-compare/call-mismatches-exclude/**`.

## Motivation

The 0095 baseline seed (PR #6343) measured 5,619 compared call sites, 735
flagged `shape` rows, 689 baselined — 410 of them in `activerecord`, the rest
concentrated in `arel`. Each row is a real port divergence invisible to
`arity.ts`, `parity:api` and `parity:api:calls`.

Those rows were filed as stories under 0095 because that is where the signal
surfaced, but 0095 is a tooling RFC: it is done when the gate is green and
wired into CI. Mixing a multi-hundred-row code burndown into it hides the
tooling's completion state and makes the burndown unschedulable as a campaign.
This RFC is that campaign, on the RFC 0084 / 0044 precedent: cluster rows by
mechanism, one convergence story per cluster.

## Scope

- Convergence of `kind: "args"` baseline rows across all packages.
- The classification pass that turns the raw row block into schedulable
  mechanism clusters.

Out of scope: the extractor, normalizer, artifact, report and ratchet
(RFC 0095), and the `naming` dimension (RFC 0096).

## Working rules

Standard convergence rules apply (CLAUDE.md, "A documented deviation is debt,
not permission"):

- A story converges. Never close one by rewording a baseline `reason`.
- The baseline is only-shrink: delete converged rows by hand, never `--write`
  or reseed.
- Never widen a baseline to cover new work.
