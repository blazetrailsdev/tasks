---
title: "Ruby block iteration tokens as ref:each where the TS port tokens loop, in the skeleton stream"
status: done
updated: 2026-08-07
rfc: "0084-wide-call-set-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6163
claim: "2026-08-07T01:48:27Z"
assignee: "datetime-new-accepts-a-non-final-fraction"
blocked-by: null
closed-reason: null
---

## Context

The ordered skeleton stream landed in PR #6161 (story
`ordered-call-skeleton-stream-in-extractors`), but its two sides token Ruby's
block iteration differently, which will read as a false divergence the moment
`call-sequence-parity-in-wide-ratchet` starts comparing sequences.

Ruby's `xs.each { |x| save(x) }` is a call, so `walk_for_skeleton`
(`scripts/api-compare/extract-ruby-api.rb`) emits `ref:each ref:save`. Its
faithful TS port is `for (const x of xs) this.save(x)`, which `extractSkeleton`
(`scripts/api-compare/extract-ts-api.ts`) emits as `loop ref:save`. Same
construct, different first token, on every ported enumerable body — and there
are thousands.

The existing `calls` gate already has the machinery for this class:
`JS_ENUMERABLE_ALIASES` and the "Ruby calls whose faithful JS port emits no call
at all" suppression list in `scripts/api-compare/compare.ts:160-175` exist for
exactly the receivers a native language construct consumes. The skeleton stream
needs the same fold, applied to a sequence rather than a set.

Filed from PR #6161 rather than folded into it: that story's acceptance criteria
required the gate output be byte-identical, and this changes what the streams
say.

## Converged shape

A fold applied where the two streams are compared (not in the extractors, which
stay raw by design — the Ruby↔TS conventions live in `compare.ts`): a Ruby
`ref:<name>` whose name is an enumerable iterator tokens as `loop`, reusing the
existing `JS_ENUMERABLE_ALIASES` / suppression populations rather than a new
list. `prism-codegen/score.ts:skeletonTokens` is the precedent for folding at
comparison time — its `LOGICAL_OPS` and `ref:get` folds do the same job.

Land it before, or as part of, `call-sequence-parity-in-wide-ratchet`; on its own
it changes only `output/call-skeletons.json`, which nothing gates on yet.

## Acceptance criteria

- [ ] A hand-checked pair — Ruby `xs.each { ... }` against a TS `for...of` port —
      compares as matched rather than divergent.
- [ ] The fold reuses the existing enumerable populations in `compare.ts`; no new
      hand-maintained name list.
- [ ] The extractors keep emitting raw names; the fold lives at the comparison.
- [ ] `calls`, the `parity:api:calls` verdict and `call-mismatches.json` are unchanged.
- [ ] Tests at the top level of `scripts/api-compare/` (the vitest glob is
      non-recursive).
