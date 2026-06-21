---
title: "persistence-test-canonical-wave12"
status: claimed
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-21T23:10:44Z"
assignee: "persistence-test-canonical-wave12"
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical-wave11`, which converted the
`save destroyed object` / `delete doesnt run callbacks` / `destroy` /
`find via reload` describe block in
`packages/activerecord/src/persistence.test.ts` to canonical `Topic`/`Post`
models + `topics`/`posts`/`authors` fixtures, and converged `save`/`save!` on a
destroyed record to Rails (`save` returns false; `save!` raises
`RecordNotSaved("Failed to save the record")`).

Remaining bespoke `defineSchema(...)` describe blocks (re-locate with
`grep -n 'defineSchema(' persistence.test.ts`):

- `defineSchema` @510 — items/posts/cm_items block (build / build many /
  save null|nil string attributes / create many / delete many / update many … /
  becomes includes errors / create columns not equal attributes) using bespoke
  `class Post`/`class CmItem`. NOTE: this is the same block `wave10` targets; if
  wave10's PR has merged by the time this is picked up, skip it.
- `defineSchema` @664 — posts block (delete / destroy / update-all-with-hash /
  update-column / increment-decrement / factory-with-block / sti /
  inherited-table tests using bespoke `class Post`).
- `defineSchema` @898 — default_records/posts block (decrement/create/update-all
  degenerate deviations).
- `defineSchema` @948 — animals/dogs/minimals/order_items/other_topics/topics
  block (update columns changing id, update, increment/decrement, destroy many,
  cpk autoincrement, update column/columns matrix, class-level destroy/delete,
  QueryConstraintsTest). Largest block.
- `defineSchema` @1587 — `update all` block. BLOCKED: the faithful Rails
  `test_update_all` passes a raw SQL string and an `["content = ?", val]` array
  to `update_all`, but trails `Relation#updateAll` only accepts a
  `Record<string, unknown>` hash. Converting this faithfully needs the
  string/array form of `update_all` implemented first (framework gap — register
  a separate fidelity story if tackling).

## Acceptance criteria

- [ ] Convert/delete the next coherent slice (one PR, <=500 LOC). Real Rails
      tests -> canonical models + fixtures, names verbatim; pure deviations deleted.
- [ ] No new duplicate test names.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean; test:compare delta non-negative.
- [ ] Register a further wave story if more than one PR of work remains; remove
      `persistence.test.ts` from `eslint/require-canonical-schema-exclude.json`
      only once FULLY converted (no `defineSchema`, no `eslint-disable`).
