---
title: "arity: reasoned exclude file with stale-entry enforcement"
status: draft
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: api-compare-tooling
deps: []
deps-rfc: []
est-loc: 150
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The calls check has a reasoned suppression file
(`scripts/api-compare/call-mismatches-exclude.json`, enforced by
`lint-call-mismatches.ts`) and wide-call excludes
(`call-mismatches-wide-exclude/`); conventions has `SKIP_GROUPS` with
per-group reasons (`scripts/api-compare/conventions.ts:120`). The arity check
has NO per-entry exclude mechanism — every justified deviation stays in
`output/arity-mismatches.json` forever, drowning real fidelity gaps (79
activerecord entries today, of which roughly a third are justified
state-threading deviations per the RFC 0072-api-compare-parity-burndown
deep dive).

Per the repo's deviation rules (CLAUDE.md, `0023-surfaced-deviations`), every
deviation must carry a reason at the point it is recorded and remain visible
as convergence debt — an exclude file with mandatory `reason` fields is the
established pattern.

## Acceptance criteria

- A reasoned exclude file (e.g. `scripts/api-compare/arity-exclude.json`)
  keyed by `package + rubyFile + rubyName`, each entry requiring a non-empty
  `reason` string.
- `compare.ts`'s arity pass (wiring around `compare.ts:912-990`) skips
  excluded pairs and reports the excluded count in the summary line
  (mirroring how call excludes surface).
- Stale-entry detection: an exclude entry whose pair no longer mismatches (or
  no longer exists) fails the check, mirroring
  `lint-call-mismatches.ts` stale handling — excludes are a ratchet, not a
  landfill.
- Tests in `arity.test.ts` (or a dedicated test) cover exclusion + staleness.
- Ships EMPTY or near-empty: populating it is the job of the
  arity-state-threading-triage story, not this one.
