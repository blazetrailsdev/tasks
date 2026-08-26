---
title: "parity:api:extra:gate passes silently on a mark above its measurement, so forgotten :tighten runs rot the ratchet"
status: draft
updated: 2026-08-26
rfc: "0121-internal-tag-accounting"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Observed while verifying PR #7084 across four rebases onto `main`.

`pnpm parity:api:extra:gate` (RFC 0117,
`scripts/api-compare/lint-extra-surface-ratchet.ts`) reads the committed marks in
`scripts/api-compare/extra-surface-mark.json` and is only-shrink: it fails when a
measurement rises ABOVE its mark, and passes silently when it falls below.
`pnpm parity:api:extra:tighten` writes the marks DOWN, and is documented in
CLAUDE.md as the step to run after converging surface.

Nothing enforces that it was run. So a PR that converges extra surface without
tightening leaves the mark loose, and the gate keeps passing at the stale, higher
number — quietly re-opening exactly as much headroom as was converged. That is
the inverse of the STALE high-water-mark check the call-set ratchet already has
(`pnpm parity:api:calls:tighten`, which DOES red when a mark sits above the
measurement).

Measured on `main` at the time of writing, after #7077 and #7083 landed:

```
extra-surface gate: OK (arel novel 0/0, total 62/62;
                        activerecord novel 374/376, total 1320/1324)
```

`activerecord` has converged 2 novel and 4 total names that the mark still
grants. Note this is only-shrink debt, not a correctness bug — but it is
unbounded: every future converging PR that forgets `:tighten` widens the gap,
and the gate can never report it.

## Converged shape

Mirror the call-set ratchet's contract. `lint-extra-surface-ratchet.ts` already
knows both the mark and the measurement, so it can additionally fail — or, if a
hard fail is too disruptive to land at once, warn with a `::warning` and a
follow-up story — when a measurement sits BELOW its mark, naming
`pnpm parity:api:extra:tighten <package>` as the remedy. Keep the existing
above-the-mark failure exactly as it is, and keep the no-reseed rule: `:tighten`
writes DOWN only.

Land the currently-outstanding tightening in the same PR so the new check starts
green.

## Acceptance criteria

- [ ] `pnpm parity:api:extra:gate` reports a mark that sits ABOVE its
      measurement, naming the package, both numbers, and `:tighten` as the fix.
- [ ] The existing above-the-mark failure path is unchanged, with a test for both
      directions.
- [ ] `scripts/api-compare/extra-surface-mark.json` is tightened so the new check
      is green on `main` (expected: `activerecord` to 374 novel / 1320 total, or
      whatever the measurement is at landing time).
- [ ] No `:reseed` path is added, and `:tighten` still refuses to raise a mark.
