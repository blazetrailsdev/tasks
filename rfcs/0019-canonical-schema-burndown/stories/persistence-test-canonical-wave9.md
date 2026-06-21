---
title: "persistence-test-canonical-wave9"
status: claimed
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-21T19:42:43Z"
assignee: "persistence-test-canonical-wave9"
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical-wave8` (deleted the bottom half of
the bespoke invented-name `Article` describe block in
`packages/activerecord/src/persistence.test.ts` — `record state` through EOF:
readonly/freeze/increment-decrement-toggle/toParam/inspect/attributeForInspect/
cacheKey/slice/assignAttributes/findOrCreateBy/findOrInitializeBy/exists/
suppress/noTouching/trailing dupes/`previously_persisted?` deviation — all pure
deviations whose behavior is covered by Rails-named tests elsewhere or belongs
to other Rails test files).

Remaining in the file (audit against
`vendor/rails/activerecord/test/cases/persistence_test.rb`):

- The TOP half of the bespoke `Article` block (`defineSchema` at ~line 1651:
  articles/validateds/requireds/trackeds/posts/users) — `save`/`saveBang`/
  `create`/`createBang`/`update (instance|class)`/`destroy`/`delete`/`reload`
  describes, all invented BDD names duplicating Rails-named upper-block tests.
  Delete pure deviations; port any genuine gap to canonical models + fixtures
  with verbatim Rails names.
- The other 7 `defineSchema(...)` describe blocks (Post/Topic/Tracked/etc.) and
  the many inline `class X extends Base` declarations.

Remaining duplicate test names to consolidate: `create through factory with
block` (lines ~744, ~892), `throws on validation failure` (the createBang/
updateBang pair in the top Article block).

## Acceptance criteria

- [ ] Convert/delete the next coherent slice (one PR, <=500 LOC). Real Rails
      tests -> canonical models + fixtures, names verbatim; pure deviations deleted.
- [ ] No new duplicate test names; consolidate duplicated families.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean; test:compare delta non-negative.
- [ ] Register a further wave story if more than one PR of work remains; remove
      `persistence.test.ts` from `eslint/require-canonical-schema-exclude.json`
      only once FULLY converted (no `defineSchema`, no `eslint-disable`).
