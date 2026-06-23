---
title: "Ratcheting baseline + CI gate for call-mismatches advisory"
status: in-progress
updated: 2026-06-23
rfc: "0044-call-set-parity-fidelity-burndown"
cluster: infra
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: 4009
claim: "2026-06-23T15:13:45Z"
assignee: "call-mismatches-ratcheting-baseline"
blocked-by: null
---

## Context

The advisory call-set parity dimension (compare.ts, PR #4002) writes
`scripts/api-compare/output/call-mismatches.json` but has no ratchet: 23
activerecord pairs are flagged and nothing prevents new ones. The other
fidelity checks ratchet via an `eslint/*-exclude.json` baseline that only
shrinks (e.g. `eslint/require-canonical-schema-exclude.json`,
`eslint/no-explicit-any-src-exclude.json`).

This story adds the same mechanism for call-mismatches so the per-cluster
burndown stories have somewhere to record confirmed behavioral equivalents,
and CI fails on any unexplained flag.

## Acceptance criteria

- `eslint/call-mismatches-exclude.json` (or `scripts/api-compare/`-local
  equivalent) keyed by `tsFile + rubyName + call`, each entry carrying a
  one-line `reason` documenting why the call is satisfied by a different path.
  Seed it empty (or only with entries the burndown stories add).
- A check (test or `pnpm api:compare` exit code / dedicated script) that fails
  when `call-mismatches.json` contains an entry not in the exclude baseline.
- The baseline is validated to only-shrink the way other excludes are (no
  stale entries pointing at calls that no longer flag).
- Wire into CI alongside the existing api-compare checks; document in the
  compare.ts header next to the calls-dimension note.

## Out of scope

- Fixing/suppressing any of the 23 entries — that is the per-cluster stories.
