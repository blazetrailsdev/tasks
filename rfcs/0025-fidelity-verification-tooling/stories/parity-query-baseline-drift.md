---
title: "parity:query has 8 unregistered failures and 20 stale known-gap registrations"
status: ready
updated: 2026-07-31
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:query` currently reports:

```text
169/204 passed, 7 known gap(s), 20 unexpected pass, 8 failure(s)
```

Two independent bookkeeping problems, both of which make the job unusable as a
gate:

**8 unregistered failures.** `ar-13`, `ar-18`, `ar-32`, `ar-38`, `ar-79`,
`ar-102`, `ar-131`, `ar-182` fail as "output differs — not in known-gaps".
Seven are bare diffs with no recorded reason. `ar-182` is the exception and is
already diagnosed in its own message: `Attribute#in()` calls `.map()` on its
argument, so it throws `values.map is not a function` on an Arel `Union` node,
where Rails passes any `Arel::Node` straight to the visitor. Each of the other
seven needs the same treatment — diagnose, then either fix or register as a
known gap with a reason.

**20 "unexpected pass".** Fixtures registered as known gaps that now pass. Each
is either a gap that was fixed without the registration being retired, or a
registration that was wrong to begin with. Left alone, these mask regressions:
a fixture that silently goes back to failing reads as "expected".

Both counts predate PR #5741 (which took the run 167 → 169 by fixing two CTE
bugs); it did not touch either bucket.

Note `pnpm parity:query` is label/schedule-gated in CI (`run-parity-sqlite`),
not a per-PR gate, which is how the drift accumulated unnoticed.

## Acceptance criteria

- Each of the 7 undiagnosed failures is either fixed or registered as a known
  gap carrying a one-line reason naming the Rails behavior it diverges from.
  `ar-182`'s existing diagnosis is enough to fix or register it directly.
- Each of the 20 unexpected passes has its known-gap registration retired.
- `pnpm parity:query` ends at 0 failures and 0 unexpected passes, so a future
  regression is visible.
- Split if it balloons: the 20 retirements are mechanical and can ship
  separately from the 8 diagnoses.

## Re-verified 2026-08-17 (ready sweep)

Re-run `pnpm parity:query` before starting: the counts in this body
(169/204, 7 known gaps, 20 unexpected passes, 8 failures) are a snapshot and the
bookkeeping bugs are what matter, not the numbers.
