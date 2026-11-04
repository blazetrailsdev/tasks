---
title: "Only-shrink ratchet and CI wiring for parity:api:privates (deferred)"
status: ready
updated: 2026-11-04
rfc: "0218-api-privates-extra-surface"
cluster: api-compare
packages: []
deps: [privates-surface-baseline-counts]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RFC's Rollout phase 3, deferred until `privates-surface-baseline-counts`
has numbers and the owner has picked the first gated packages. The shape to
copy is the public lane's: `scripts/api-compare/lint-extra-surface-ratchet.ts`
(GROWTH / UNMEASURED / STALE arms, `--tighten`, no reseed) over
`scripts/api-compare/extra-surface-mark.ts` and `extra-surface-mark.json`,
wired in CI's `Rails API/Test Comparison` job.

## Acceptance criteria

- `scripts/api-compare/privates-surface-mark.json` and a ratchet script
  exposed as `pnpm parity:api:privates:gate` and
  `pnpm parity:api:privates:tighten`; tighten writes each dimension DOWN only
  and there is no reseed verb.
- Gated dimensions: `novel`, `moved`, `visibility` per gated package; `allowed`
  is reported, not gated, unless the owner rules otherwise.
- The gated package set is only-grow and holds only the packages the baseline
  story named; an un-measured gated package fails (UNMEASURED).
- CI runs the gate in the `Rails API/Test Comparison` job after
  `parity:api`, and `CLAUDE.md`'s "Before you open the PR" list gains the
  command.
- Tests mirror `extra-surface-mark.test.ts`.
