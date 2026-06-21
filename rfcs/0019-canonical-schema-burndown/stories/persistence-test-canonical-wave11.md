---
title: "persistence-test-canonical-wave11"
status: ready
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical-wave10`, which converted the first
remaining bespoke `defineSchema` describe block (the `build` / `build many` /
`save … string attributes` / `create many` / `delete many` / `update many …` /
`becomes includes errors` / `create columns not equal attributes` block) in
`packages/activerecord/src/persistence.test.ts` to the canonical `Topic` model

- `topics`/`companies` fixtures. Also fixed `Base.update([dupIds], [attrs])` to
  dedup ids before the batched `find` (Rails finds per-id; our batch `find`
  rejects duplicate ids).

Remaining bespoke `defineSchema(...)` describe blocks (line numbers after
wave10 merge; re-locate with `grep -n 'defineSchema(' persistence.test.ts`):

- `defineSchema` @617 — posts/cb_posts/special_posts/count_posts/ts_posts/timed_posts
  block (delete / destroy / update-all / update-column / increment-decrement /
  factory-with-block / sti / inherited-table tests using bespoke `class Post`).
- `defineSchema` @851 — default_records/posts block (decrement/create/update-all
  degenerate deviations).
- `defineSchema` @901 — animals/dogs/minimals/order_items/other_topics/topics
  block (update columns changing id, update, increment/decrement, destroy many,
  cpk autoincrement, update column/columns matrix, class-level destroy/delete,
  QueryConstraintsTest). This is the largest block.
- `defineSchema` @1434 — destroyBy/deleteBy block.
- `defineSchema` @1582 — update column / update columns block.

## Acceptance criteria

- [ ] Convert/delete the next coherent slice (one PR, <=500 LOC). Real Rails
      tests -> canonical models + fixtures, names verbatim; pure deviations deleted.
- [ ] No new duplicate test names.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean; test:compare delta non-negative.
- [ ] Register a further wave story if more than one PR of work remains; remove
      `persistence.test.ts` from `eslint/require-canonical-schema-exclude.json`
      only once FULLY converted (no `defineSchema`, no `eslint-disable`).

## Notes / gotchas (from wave10)

- `Base.instantiate` (public) is NOT wired onto Base — only `_instantiate`. The
  wave10 `create columns not equal attributes` test used `Topic._instantiate`.
  Some blocks may need the same workaround (or wire `instantiate`).
- Topic's `content` column is `serialize`d and does not round-trip plain strings
  cleanly in trails right now; wave10 used `title` instead of `content` for the
  update-many tests. Prefer `title` or register a serialize convergence story.
