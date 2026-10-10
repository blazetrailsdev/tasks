---
title: "trailmap: re-vendor trails and re-measure Story load and attribute reads after the cast-cache fix"
status: draft
updated: 2026-10-05
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails PR 8540 closed `attribute-reads-allocate-a-block-on-every-cache-hit` with one acceptance
criterion checked only by proxy: "`Story.all()` load time does not regress from `5ee5760880`".
The parent story's table was measured on trailmap's `Story` (11,531 rows, SQLite); nothing in
PR 8540 was measured there.

What PR 8540 measured instead, in trails:

- 100,000 `fetchValue("id")` calls on already-cast `LazyAttributeSet`s, plain node against `dist`:
  80.2 ms before, 7.3-8.7 ms after (`packages/activemodel/src/attribute-set/builder.bench.ts`).
- 1,000 `Topic.all().toArray()` calls over the 5-row canonical `topics` fixture on SQLite:
  743-803 ms on the branch, 747-768 ms on its merge base. Mostly query overhead, so it says little
  about per-row cost.

The change is `LazyAttributeSet#fetchValue`
(`packages/activemodel/src/attribute-set/builder.ts`, mirroring
`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:41-58`) answering a
cast value before building its block, and `block`, `fetch`, `hashAref`, `hasKey` and `ownMethod`
in `packages/ruby-compat/src/hash.ts` taking a plain-object receiver first.

## Acceptance criteria

- [ ] trailmap is re-vendored to a trails commit at or after the PR 8540 merge.
- [ ] The parent story's five rows (`Story.all().toArray()`, 115,310 reads of `story.id` and of
      `story.priority`, the `(priority, id)` sort, serialize all) are re-measured and recorded
      against the `9e17ddc98d` and `5ee5760880` columns.
- [ ] If reads are still above the `9e17ddc98d` column or load is above the `5ee5760880` column,
      a trails story is filed with a CPU profile of the slow row.
