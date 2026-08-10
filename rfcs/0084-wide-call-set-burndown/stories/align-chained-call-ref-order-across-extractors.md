---
title: "Ruby and TS call-skeleton extractors emit chained-call refs in opposite orders"
status: done
updated: 2026-08-07
rfc: "0084-wide-call-set-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6193
claim: "2026-08-07T19:20:43Z"
assignee: "strftime-lacks-composite-conversions"
blocked-by: null
closed-reason: null
---

## Context

The two call-skeleton extractors emit a chained call's refs in opposite orders,
which manufactures `order:` rows that no edit to the port can close.

Worked example — `preloader/through-association.ts::through_scope` vs
`vendor/rails/activerecord/lib/active_record/associations/preloader/through_association.rb:86`
(`scope = through_reflection.klass.unscoped`). From `output/call-skeletons.json`:

- Ruby side: `['ref:unscoped', 'ref:klass', 'ref:through_reflection', ...]` —
  outermost call first, receivers after.
- TS side: `['ref:throughReflection', ..., 'ref:klass', 'ref:unscoped', ...]` —
  evaluation order, receivers first.

The port is a faithful transcription of the Ruby and the row still fires
(`order:klass,unscoped → unscoped,klass`). Same shape on
`preloader/through-association.ts::{source_preloaders,through_preloaders}`
(`order:constructor,loaders`, from `Preloader.new(...).loaders` at
`through_association.rb:79`) and `join-dependency.ts::aliases`
(`order:map,constructor`).

`scripts/api-compare/extract-ruby-api.rb` and
`scripts/api-compare/extract-ts-api.ts` are the two emitters;
`0084-wide-call-set-burndown`'s `ordered-call-skeleton-stream-in-extractors`
(done) is where the streams were added.

## Converged shape

Pick one traversal order and make both extractors emit it — evaluation order
(receiver before the call it receives) is the natural one for both ASTs and is
what a reader comparing the two bodies expects. Then re-run
`API_COMPARE_FORCE=1 pnpm parity:api --calls` and hand-delete every `order:`
row that goes stale (only-shrink, via `serializeBaseline`; no `--write`).

## Acceptance criteria

- [ ] Both extractors emit chained-call refs in the same traversal order,
      covered by a test in `extractor-skew.test.ts` (or a new sibling) that
      pins the order for a chained call on each side.
- [ ] Every `order:` row that goes stale as a result is deleted by hand from its
      `call-mismatches-exclude/` shard.
- [ ] `pnpm parity:api:calls` green; `pnpm parity:api` deltas non-negative.
