---
title: "persistence-test-canonical-wave13"
status: in-progress
updated: 2026-06-22
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3855
claim: "2026-06-22T01:11:06Z"
assignee: "persistence-test-canonical-wave13"
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical-wave12`, which converted the
`default_records`/`posts` `defineSchema` block in
`packages/activerecord/src/persistence.test.ts` to canonical `Topic`/`Person`
models + `topics`/`people`/`cars` fixtures (faithful
`decrement with touch an attribute updates timestamps`,
`create through factory with block`,
`create many through factory with block`, and
`update all with custom sql as value` — the last via `Arel.sql` hash value on
`updateAll`), and removed the duplicate bespoke
`create through factory with block` stub from the posts block.

Remaining bespoke `defineSchema(...)` describe blocks (re-locate with
`grep -n 'defineSchema(' persistence.test.ts`; line numbers drift):

- `defineSchema` @592 — items/posts/cm_items block (build / build many /
  save null|nil string attributes / create many / delete many / update many … /
  becomes includes errors / create columns not equal attributes) using bespoke
  `class Post`/`class CmItem`. NOTE: same block `wave10` targets; skip if its PR
  has merged.
- `defineSchema` @746 — posts block (delete / destroy / update-all-with-hash /
  update-column / increment-decrement / factory-with-block / sti /
  inherited-table tests using bespoke `class Post`/`class PostClass`/`class Item`).
- `defineSchema` @1030 — animals/dogs/minimals/order_items/other_topics/topics
  block (update columns changing id, update, increment/decrement, destroy many,
  cpk autoincrement, update column/columns matrix, class-level destroy/delete,
  QueryConstraintsTest). Largest block.
- `defineSchema` @1711 — bespoke `class Post` block.
- `defineSchema` @1563 — `update all` block. BLOCKED: the faithful Rails
  `test_update_all` passes a raw SQL string and an `["content = ?", val]` array
  to `update_all`, but trails `Relation#updateAll` only accepts a
  `Record<string, unknown>` hash. Needs the string/array form of `update_all`
  implemented first (framework gap — register a separate fidelity story).

The `@105` `defineSchema` is the canonical `afterAll` `topics` rebuild shield —
leave it.

## Acceptance criteria

- [ ] Convert/delete the next coherent slice (one PR, <=500 LOC). Real Rails
      tests -> canonical models + fixtures, names verbatim; pure deviations deleted.
- [ ] No new duplicate test names.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean; test:compare delta non-negative.
- [ ] Register a further wave story if more than one PR of work remains; remove
      `persistence.test.ts` from `eslint/require-canonical-schema-exclude.json`
      only once FULLY converted (no `defineSchema`, no `eslint-disable`).
