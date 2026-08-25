---
title: "Extractors emit an ordered call/control skeleton stream (prerequisite for sequence parity)"
status: done
updated: 2026-08-07
rfc: "0084-wide-call-set-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6161
claim: "2026-08-07T00:48:36Z"
assignee: "datetime-carries-no-fractional-seconds"
blocked-by: null
closed-reason: null
---

## Context

Prerequisite for `call-sequence-parity-in-wide-ratchet`, discovered while
attempting that story in PR #6146 (released unstarted as a result).

That story assumes the wide ratchet can be moved from set comparison to
sequence comparison inside `scripts/api-compare/compare.ts`. It cannot, because
**ordering is destroyed at the source, before the comparator ever sees it**:

- `scripts/api-compare/extract-ts-api.ts:2545` `extractCalls()` accumulates into
  `const names = new Set<string>()` and returns `[...names]`. Source order is
  gone, and duplicate calls collapse.
- It records no control-flow tokens at all — no `if` / `loop` / `try` / `throw`,
  which is half the signal `scripts/prism-codegen/score.ts:skeletonTokens`
  carries.
- `compare.ts:checkCalls` then flattens further (`tsCandidateSets.flat()`,
  `effectiveTsCalls`, `includeGraphCalls` union into a `Set`), so even an
  ordered input would not survive to the comparison point.

The Ruby side must be checked too — `extract-ruby-api.rb`'s `calls` array may
preserve order, but it also needs the control keywords to be comparable.

## Converged shape

Emit a parallel **ordered skeleton stream** alongside the existing `calls` set,
on both extractors, modelled on `prism-codegen/score.ts:skeletonTokens`: an
ordered token list of control keywords (`if`/`loop`/`try`/`throw`),
`new:Ctor`, and normalized call/property reaches. Keep the existing `calls`
set untouched so the current ratchet keeps working unchanged — this story adds
the signal, it does not switch the gate over.

Carry it through `compare.ts` without the set-flattening that
`effectiveTsCalls` / `includeGraphCalls` apply, since those are set operations
by construction and a sequence needs its own merge rule (or none).

Only once this lands can `call-sequence-parity-in-wide-ratchet` implement the
`matched` / `reordered` / `divergent` split and seed its rows.

## Acceptance criteria

- [ ] `extract-ts-api.ts` emits an ordered skeleton token stream per method,
      preserving source order and duplicates.
- [ ] The Ruby extractor emits the same token vocabulary for the same
      constructs, verified on a hand-checked method pair.
- [ ] The stream survives into `compare.ts` uncollapsed and is written to the
      artifact.
- [ ] The existing `calls` set and `parity:api:calls` gate output are byte-identical
      before and after (this story adds signal, changes no verdict).
- [ ] Tests at the top level of `scripts/api-compare/` (the vitest glob is
      non-recursive).
