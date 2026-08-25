---
rfc: "0099-call-argument-convergence"
title: "Call-argument convergence burndown (activerecord + deps)"
status: closed
created: 2026-08-10
updated: 2026-08-22
owner: "@deanmarano"
packages:
  - activerecord
  - arel
  - activemodel
  - activesupport
  - i18n
  - globalid
clusters:
  - "api-compare"
related-rfcs:
  - "0095-call-argument-parity"
  - "0096-naming-identifier-burndown"
  - "0084-wide-call-set-burndown"
priority: 2
---

## Summary

Burn down the call-argument divergences that RFC 0095's tooling now measures:
ported bodies that call what Rails calls, with a different argument count,
order, literal value or kwarg key. RFC 0095 built the extractor, the
normalizer, the artifact and the only-shrink ratchet; this RFC owns the
_convergence_ — the code edits that delete `kind: "args"` rows from
`scripts/api-compare/call-mismatches-exclude/**`.

**This RFC covers `activerecord` and the packages it depends on, and nothing
else.** It is not the home for every `kind: "args"` row in the repo. The
action\* / rack / trailties rows are a separate stack and belong to a separate
RFC — see Scope. If you are about to file a story here for a package not in the
`packages:` list above, that is the signal to open the other RFC, not to widen
this one.

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

- Convergence of `kind: "args"` baseline rows in `activerecord` and the
  packages it depends on: `activerecord` (372 rows), `activesupport` (45),
  `arel` (31), `activemodel` (29), `i18n` (10), `globalid` (3) — 490 rows.
- The classification pass that turns the raw row block into schedulable
  mechanism clusters.

Out of scope:

- The extractor, normalizer, artifact, report and ratchet (RFC 0095), and the
  `naming` dimension (RFC 0096).
- `kind: "args"` rows outside the activerecord dependency graph:
  `actiondispatch` (77), `actioncontroller` (43), `trailties` (30), `rack` (26),
  `actionview` (16), `abstractcontroller` (5) — 197 rows. Same mechanism, but a
  different stack; they get their own RFC rather than riding along here. Do not
  file stories for them against this RFC.

## Working rules

Standard convergence rules apply (CLAUDE.md, "A documented deviation is debt,
not permission"):

- A story converges. Never close one by rewording a baseline `reason`.
- The baseline is only-shrink: delete converged rows by hand, never `--write`
  or reseed.
- Never widen a baseline to cover new work.
- **Never widen this RFC's `packages:` list.** The list is the scope boundary,
  and `pnpm tasks set-packages` enforces it — a story may only declare packages
  its parent RFC declares, so an out-of-graph story fails validation rather
  than drifting in unnoticed. Adding a package to the list to make such a story
  fit defeats the check. File it against the action-stack RFC instead.
- A story here converges rows in one of the six in-scope packages. If a
  convergence spills into an out-of-graph package, split it — do not carry the
  extra package along.
