---
title: "Narrow the seven arm-throw mark dimensions left above their measurement"
status: draft
updated: 2026-09-09
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/arm-throw-mark.json` has drifted above its measurement in
seven dimensions across two packages. `pnpm parity:api:arms:throws` reports each
one and still exits 0, because a mark left ABOVE the measurement is reported
rather than failed (`scripts/api-compare/lint-arm-throws.ts:11-15`) — so the
drift is invisible unless someone reads the passing output:

```text
arm-throw gate: actiondispatch total mark 7 is above the current 6
arm-throw gate: actiondispatch routing/route-set.ts mark 1 is above the current 0
arm-throw gate: activerecord total mark 35 is above the current 30
arm-throw gate: activerecord associations/singular-association.ts mark 1 is above the current 0
arm-throw gate: activerecord attribute-methods.ts mark 1 is above the current 0
arm-throw gate: activerecord connection-adapters/postgresql-adapter.ts mark 4 is above the current 2
arm-throw gate: activerecord relation/finder-methods.ts mark 2 is above the current 1
```

Each row is a raise somebody already restored without narrowing the mark in the
same PR, which is the step CLAUDE.md asks for. The mark was last written by
PR `#7601`; `routing/route-set.ts` alone was then touched by PRs `#7630`,
`#7632`, `#7612`, `#7611` and `#7610`, one of which converged its missing
raise.

The cost is that the gate is looser than reality for those six files: a
regression that re-drops a raise in `postgresql-adapter.ts` can consume two
rows of slack before the ratchet notices. Only-shrink is the whole mechanism,
and slack defeats it.

Surfaced by PR `#7641`, which hit this from the wrong end. Its author read the
7 -> 6 actiondispatch movement as its own and tightened, which swept these
unrelated shards into a Journey PR; the tighten was reverted there because
narrowing a shard you did not converge is exactly what the tighten contract
forbids. The rows still need retiring — by a PR that owns them, which is this
one.

## Converged shape

Run `pnpm parity:api:arms:throws:tighten`, which writes each dimension DOWN and
never up, and commit only `arm-throw-mark.json`. There is no reseed, for the
same reason the call baselines forbid one.

Confirm before committing that every narrowed dimension corresponds to a raise
that IS present in the TS body — the mark measures missing raises, so a
dimension can also fall because a compared pair disappeared. A row that fell
because a method was deleted rather than fixed is not a convergence, and should
be called out in the PR body rather than silently pocketed.

## Acceptance criteria

- [ ] `pnpm parity:api:arms:throws` reports no dimension above its measurement.
- [ ] Every narrowed dimension is traced to the PR that restored its raise, and
      the trace is in the PR body.
- [ ] `arm-throw-mark.json` is the only file changed.
- [ ] No mark is raised anywhere in the diff.
