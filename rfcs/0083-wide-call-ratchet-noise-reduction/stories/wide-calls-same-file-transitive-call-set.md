---
title: "Make the TS call-set a same-file transitive closure (helper extraction)"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 200
pr: 5728
claim: "2026-07-31T18:02:32Z"
assignee: "wide-calls-same-file-transitive-call-set"
blocked-by: null
closed-reason: null
---

## Context

`checkCalls` compares a Rails body's calls against the TS call-set of exactly
one `(tsFile, tsName)` pair (`compare.ts:1638`). The only escape hatch is
`effectiveTsCalls` (`compare.ts:337-346`), which unions a delegate's calls in
only when `isDelegatingWrapper` holds — the body must contain its own name AND
have at most `DELEGATION_MAX_CALLS = 3` calls (`compare.ts:295`, `:318-320`).

So extracting a helper out of any body with four or more calls moves those calls
out of the gate's view and trips it, even though the port still makes every call
Rails makes. This is the single most common cause of a wide-ratchet failure on
an otherwise-correct PR.

Measured: 518 of the 5038 live rows clear when the TS call-set is expanded
transitively (depth 3) through same-file callees.

## Acceptance criteria

- `effectiveTsCalls` computes a depth-limited (default 3) transitive closure of
  the TS call-set over methods defined in the SAME `tsFile`, replacing the
  `isDelegatingWrapper` ≤3-call special case.
- Closure is same-file only. It must NOT reach the package-wide
  `tsCallsByName` map for non-wrapper bodies — that map is deliberately coarse
  and is only sound for the forwarder case it was built for (see the
  `effectiveTsCalls` doc comment).
- Cycles terminate; depth is a named constant with a comment justifying it.
- The narrow RFC 0044 gate sees the same change (it shares `checkCalls`) — the
  narrow baseline is reseeded in the same PR if it moves, and the PR body states
  the narrow delta explicitly.
- Baseline reseeded; expected delta ≈ −414 wide rows (−518 measured before
  receiver scoping; the two overlap).
