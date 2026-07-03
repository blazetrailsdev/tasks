---
title: "convert-defineschema-use-fixtures-test"
status: ready
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 phase 3 split-out. The parent story
`convert-bespoke-defineschema-test-helpers` converted the three clean
test-helpers files (naked-fixtures, repair-validations, use-transactional-tests)
in its PR but deferred `test-helpers/use-fixtures.test.ts` because a naive drop
of its `defineSchema(TEST_SCHEMA)` beforeAll blocks does NOT work.

The failure: many `use-fixtures.test.ts` describe blocks seed against
`() => Base.adapter` — the module-level test-adapter singleton
(fresh SQLite `:memory:`) — NOT `Base.connection`, which routes through the
per-worker connectionHandler onto the template-cloned worker DB that carries the
boot-laid canonical schema (`test-setup-worker-db.ts` /
`template-global-setup.ts`). The removed `defineSchema(TEST_SCHEMA)` was laying
the full canonical schema onto that singleton adapter. Dropping it makes every
canonical table ("author_addresses", "encrypted_books", …) disappear — 32 tests
fail with `Could not find table '<x>'` (verified locally).

Relevant code:

- `packages/activerecord/src/test-helpers/use-fixtures.test.ts` — 13
  `defineSchema` references (import + calls at ~57 TYPE_CONTRACT_SCHEMA, and
  ~10 `defineSchema(TEST_SCHEMA)` beforeAll blocks + 2 inside encryption
  beforeAlls).
- `packages/activerecord/src/test-helpers/setup-handler-suite.ts` —
  `establishFromTestConfig()` wires `Base.connection` to the worker DB.
- Contrast: `associations/eager.test.ts` (PR #4446) rode `Base.connection` and
  its canonical tables were already boot-laid, so a plain drop worked there.

## Acceptance criteria

- All `defineSchema(` references in `use-fixtures.test.ts` removed
  (`git grep -c "defineSchema(" ...` -> 0), converted faithfully: either rewire
  the affected describe blocks to seed against `Base.connection` (the boot-laid
  worker DB) so they ride the canonical schema, or `create_table` any genuinely
  bespoke tables with a teardown drop.
- All tests in the file pass on SQLite (and don't regress PG/MySQL).
- No test renames; `test:compare` delta >= 0.
- Single PR from main, <=500 LOC, not stacked.
