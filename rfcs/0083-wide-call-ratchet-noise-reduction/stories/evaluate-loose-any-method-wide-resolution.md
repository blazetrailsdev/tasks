---
title: "Evaluate relaxing wide-gate resolution to any-method-in-the-graph (+285 rows)"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5738
claim: "2026-07-31T19:02:56Z"
assignee: "evaluate-loose-any-method-wide-resolution"
blocked-by: null
closed-reason: null
---

## Context

Measured while shipping `record-delegation-edges-in-ts-extractor` (PR #5730),
which added `MethodInfo.delegatesTo` / `ClassInfo.delegatesTo` to
`scripts/api-compare/extract-ts-api.ts` (`delegationTargetName`).

Widening `audit-cross-file-calls.ts`'s graph traversal to follow the new
delegation edges, against the regenerated `call-mismatches-wide.json`
(3693 rows):

| metric                                                            | include-graph only | + delegation edges |
| ----------------------------------------------------------------- | ------------------ | ------------------ |
| strict (same-named definition in a reachable file makes the call) | 25                 | 25                 |
| loose (ANY method in a reachable file makes the call)             | 378                | 663                |
| rows whose reachable file-set grows                               | —                  | 1129               |
| rows with NO graph edge at all that gain one                      | —                  | 412                |

The delegation edge buys **0 additional rows under same-name resolution**, which
is what `resolve-wide-candidates-through-include-graph` is scoped to consume. The
entire +285 sits behind a _different_ change: relaxing wide-gate resolution from
"a definition of the SAME method name elsewhere makes the call" to "ANY method in
a reachable file makes the call".

That relaxation is a soundness decision, not a plumbing one, and it is exactly
the axis the cross-file audit warned about: crediting a file with a call made by
an unrelated method in the same graph can mask a per-adapter fidelity gap. It
needs its own evidence — a sample of what the 285 rows actually are — before any
gate consumes it.

## Acceptance criteria

- Sample and classify the 285 rows the loose metric adds over the strict one
  (`audit-cross-file-calls.ts`, traversal following `delegatesTo`): how many are
  genuine same-concern ports vs. unrelated methods that merely share a graph.
- Recommend adopt / reject with that sample as evidence; if adopting, state the
  narrowing that keeps it sound (e.g. restrict to the delegation target's own
  file rather than the whole transitive graph).
- No gate change in this story unless the sample supports it; the wide baseline
  moves only with a reseed and a recorded delta.
- `resolve-wide-candidates-through-include-graph` stays scoped to strict
  same-name resolution — this story does not silently absorb it.
