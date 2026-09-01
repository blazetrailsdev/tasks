---
title: "activerecord extra-surface total mark is stale above the measurement"
status: in-progress
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: 2
pr: 7352
claim: "2026-09-01T18:29:06Z"
assignee: "ts-methods-by-file-pools-deps-under-shared-relative-path"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra:gate` reports, on an untouched checkout of `main`:

```text
extra-surface gate: activerecord total mark 986 is above the current 985 —
narrow it with `pnpm parity:api:extra:tighten`.
```

Confirmed pre-existing during PR #7172 by reverting that branch's edits,
rebuilding, and re-measuring: `activerecord 221 files, 367 novel, 618 moved,
985 total` against the committed `{ novel: 367, total: 986 }` in
`scripts/api-compare/extra-surface-mark.json`. One `moved` name converged
without its mark being tightened — the mark file was last written by #7167.

The mark is only-shrink, so a mark sitting ABOVE the measurement is slack: it
silently permits one new extra AR name before the gate can fire.

## Converged shape

`pnpm parity:api:extra:tighten`, which writes each dimension DOWN and never up,
after a full `pnpm build` + `API_COMPARE_FORCE=1 pnpm parity:api` so the
measurement is not taken against a stale build (extra-surface totals move with
build state).

## Acceptance criteria

- `scripts/api-compare/extra-surface-mark.json` carries activerecord at the
  measured total, written by `:tighten` and not by hand or by a reseed.
- `pnpm parity:api:extra:gate` reports OK with no stale line.
- arel's marks are untouched.
