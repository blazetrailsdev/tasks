---
title: "The call-ORDER check still lets a sibling claim a suppressed call's TS position"
status: done
updated: 2026-08-19
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6730
claim: "2026-08-18T23:11:21Z"
assignee: "order-check-ignores-suppressed-call-claims"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing `suppressed-call-lets-sibling-claim-ts-candidate` (PR #6729),
which fixed RFC 0106 Open Question 1 for the call-set MEMBERSHIP check only.

That PR added `suppressedCallClaims` (`scripts/api-compare/compare.ts`) and wired it
into `significantMissingCalls`: a Ruby call the ported-with-args gate SUPPRESSES now
consumes the TS spelling it ports, so a sibling Ruby call mapping to the same TS name
can no longer be credited with it.

The ORDER check — the second consumer of the same gates, immediately below
`significantMissingCalls` in the same file (the function that computes the
`order:`-prefixed flags, `ORDER_PREFIX`) — was deliberately left alone as out of scope
for that story, and still has the untreated form of the bug. It applies the SAME
`significant` / `narrowPredicateCandidates` / `!mapped.some(isPortedWithArgs)` gate
sequence over `bodyRubyCalls`, so a suppressed Ruby call's TS spelling is still
available to a sibling there. Where that happens, the sibling is credited with a
POSITION in the TS sequence that belongs to the suppressed call, and the order
comparison is made against a sequence the body does not actually have.

The file already recognises this class of problem for a different cause: `ambiguousTsNames`
(compare.ts) drops a TS name from the order comparison when TWO OR MORE of a body's Ruby
calls could be ported as it, on the stated ground that "a position is one indivisible fact
that has to be attributed to exactly one call, so an ambiguous name carries no usable
position". A suppressed call holding a spelling is the same fact arriving by a different
route — the second owner is simply invisible to the gate rather than visible-and-tied.

Note the asymmetry argued in `ambiguousTsNames`' JSDoc (membership is a set comparison and
cannot demand two Ruby calls be satisfied by two distinct TS names, order can) does NOT
argue against this: it explains why `ambiguousTsNames` is order-only, not why the order
check should ignore a claim the membership check now honours.

## Converged shape

Feed the order check the same claim set, in whichever of the two shapes measures clean:

- fold `suppressedCallClaims`' output into `ambiguousTsNames`' result at the order call
  site, so a claimed name carries no usable position exactly as an ambiguous one does; or
- withhold claimed names from the TS sequence before it is deduplicated at first
  occurrence, mirroring what `significantMissingCalls` now does to `tsCalls`.

Measure the whole-artifact before/after the way PR #6729 did
(`API_COMPARE_FORCE=1 pnpm parity:api --calls`, diff the `order:`-prefixed rows of
`output/call-mismatches.json`) and state the row delta in the PR body. Expect it to be
small — `SUPPRESSED_CALL_TS_SPELLINGS` currently carries one entry — but the direction
matters: any new `order:` row is a real inversion the gate could not previously see, and
each needs a reviewed `call-mismatches-exclude` reason or a convergence.

Requires a full `pnpm build` before `parity:api` or the run aborts on a stale build.

## Acceptance criteria

- [ ] A Ruby call suppressed by the ported-with-args gate no longer leaves its TS
      spelling available to a sibling in the ORDER comparison, matching the treatment
      `significantMissingCalls` received in PR #6729.
- [ ] The interaction with `ambiguousTsNames` is settled in one place rather than two
      overlapping filters, and its JSDoc says which.
- [ ] Whole-artifact before/after measured and the `order:` row delta stated; any new row
      carries a reviewed reason or is converged.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; no net new baseline
      rows beyond those explicitly reviewed.
