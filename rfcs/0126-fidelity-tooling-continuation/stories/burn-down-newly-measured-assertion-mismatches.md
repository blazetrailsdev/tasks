---
title: "burn-down-newly-measured-assertion-mismatches"
status: draft
updated: 2026-08-28
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7159 (RFC 0126, `assertion-metrics-measured-for-one-package-only`) removed
`ASSERTION_REPORT_PACKAGES` from `scripts/test-compare/compare.ts`, so the three
assertion-level counters are now computed for every compared package instead of
eight of them.

On `origin/main` each counter had exactly one increment site — `compare.ts:644`,
`:665`, `:688` — and all three sat behind `if (!ASSERTION_REPORT_PACKAGES.has(pkg))
return;` (`:634`, `:653`, `:674`), with the set at `:80` excluding these six
packages. Their `0/0/0` rows in `assertion-mismatch-mark.json` were therefore
0 by construction, never a measurement. #7159 wrote each up to its first real
measurement (`--write` only lowers, so this could not be a reseed):

| package | assertionCount | kind | value |
| --- | --- | --- | --- |
| abstractcontroller | 5 | 18 | 0 |
| actioncontroller | 286 | 473 | 76 |
| actiondispatch | 364 | 519 | 74 |
| actionview | 41 | 96 | 2 |
| rack | 372 | 471 | 61 |
| trailties | 46 | 72 | 4 |

None of it is new debt — the ports diverged from their Rails counterparts before
the measurement existed. This story owns retiring it. The mark is only-shrink
from here, so every convergence is bankable with
`pnpm parity:test:assertions:reseed`.

Per-test breakdown:

```sh
pnpm parity:test --assertions --missing --package <pkg>
```

## Acceptance criteria

- Per claimed slice, the trails test asserts what its Rails counterpart asserts
  — same number of assertions, same kinds, same literal expected values. Read
  the Rails test first; the test NAME never changes (CLAUDE.md).
- `pnpm parity:test:assertions:reseed` lowers the slice's counters, and the
  lowered mark is committed in the same PR.
- No counter is raised, and `ASSERTION_REPORT_PACKAGES` is not reintroduced to
  scope a package back out of the measurement.
- Split per package as claimed; actiondispatch (364/519/74) and rack (372/471/61)
  are the two largest and want their own stories.
