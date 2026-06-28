---
title: "persistence-test-canonical-wave16"
status: claimed
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: "2026-06-28T18:26:32Z"
assignee: "persistence-test-canonical-wave16"
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical-wave15` (wave15 converted the bespoke posts/cb_posts/special_posts/ts_posts `defineSchema` block: `delete new record`, `destroy new record`, `destroy record with associations`, `delete record with associations` → canonical `Client`; `instantiate creates a new instance` → canonical `Post` + `SpecialPost`; `create with custom timestamps` → canonical `LiveParrot`; `becomes errors base` → canonical `AdminUser` subclass; removed deviation stubs for `update all with hash`, `update columns with default scope`, `reload via querycache`, `model with no auto populated fields still returns primary key after insert`, `update attribute in before validation respects callback chain`, `persist inherited class with different table name`).

Remaining bespoke `defineSchema(...)` describe blocks in `persistence.test.ts` (locate with `grep -n 'defineSchema(' persistence.test.ts`):

- animals/dogs/minimals/order_items/other_topics/topics block (`@~1098`): largest bespoke block. Covers many tests — needs careful test-by-test analysis against `persistence_test.rb`.
- bespoke `class Post` `update all` block (`@~1742`) — BLOCKED: faithful `test_update_all` passes a raw SQL string and `["content = ?", val]` array to `update_all`, but trails `Relation#updateAll` only accepts a `Record<string, unknown>` hash. Needs the string/array form first.

## Acceptance criteria

- [ ] Convert/delete the next coherent slice (one PR). Real Rails tests → canonical models + fixtures, names verbatim; pure deviations deleted.
- [ ] No new duplicate test names.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes; `pnpm lint` and `node scripts/typecheck.mjs` clean; test:compare delta non-negative.
- [ ] Register a further wave story if more than one PR of work remains; remove `persistence.test.ts` from `eslint/require-canonical-schema-exclude.json` only once FULLY converted (no `defineSchema`, no `eslint-disable`).

Hard rules:

- NO node:\* imports.
- NO process.\* references.
- Async fs only.
- No new third-party runtime deps.
- 500 LOC ceiling. NO STACKED PRs. Single PR from main.
- Test names match Rails verbatim.
