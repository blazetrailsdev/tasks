---
title: "Count a pair whose Ruby calls are all weak instead of dropping it from the call population"
status: done
updated: 2026-08-18
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6689
claim: "2026-08-18T12:07:58Z"
assignee: "wave-4e-schema-dumper-migration-residue"
blocked-by: null
closed-reason: null
---

## Context

Measured while landing `core-receiver-calls-in-core-ext-are-not-ported-methods`
(PR #6680): the call-set population moved 5762 -> 5649 matched pairs, purely
because more calls became `weak`.

The cause is `checkCalls` in `scripts/api-compare/compare.ts`:

```ts
const rubyCalls = dropWeakCalls(rubyOwned?.calls, rubyOwned?.weak);
if (rubyCalls.length === 0) return;
```

A Ruby body whose EVERY call is weak (an inert receiver, a Ruby core call in a
`core_ext/**` body, a `Proc.new`) leaves the compared population entirely
rather than being compared and found clean. Two consequences:

- the headline "N matched pairs checked" number goes DOWN when a false-positive
  class is converged, which reads like lost coverage and makes the metric move
  in the wrong direction for exactly the work the RFC wants;
- such a pair is never re-examined: if the TS body later drops a call Rails
  makes that is NOT weak, nothing re-admits the pair until someone regenerates
  and notices — the early return is keyed on the RUBY side only, which is
  stable, so the body is effectively unwatched.

## Converged shape

Count the pair. The early return exists to avoid reporting a mismatch when
there is nothing to compare, which a zero-length `missing` set already
achieves — so the fix is to let the pair reach `callsCompared++` and the
`significantMissingCalls` call, which returns empty for an empty `rubyCalls`,
rather than to return before either.

Verify the reported mismatch COUNT is unchanged by the change (only the
`compared` denominator moves), and that `pnpm parity:api:calls` /
`pnpm parity:api:calls:args` stay green with no baseline movement.

## Acceptance criteria

- A pair whose Ruby call set is empty after `dropWeakCalls` is counted in
  `callsCompared` instead of skipped.
- No new mismatch rows and no baseline movement; both gates green.
- A unit test in `scripts/api-compare` pins that a fully-weak Ruby body is
  compared (and clean) rather than dropped from the population.
