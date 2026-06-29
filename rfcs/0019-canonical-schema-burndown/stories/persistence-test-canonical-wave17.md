---
title: "persistence.test.ts final wave → drop last 4 defineSchema + delist"
status: claimed
updated: 2026-06-29
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: 3
pr: null
claim: "2026-06-29T10:10:13Z"
assignee: "persistence-test-canonical-wave17"
blocked-by: null
---

## Context

Final wave for `packages/activerecord/src/persistence.test.ts` — every prior
persistence wave (wave2–wave16 + the residual/dup clusters) is `done`, but the
file is **still in `eslint/require-canonical-schema-exclude.json`** because 4
`defineSchema(...)` calls remain. RFC 0019 delists the file only when it is
FULLY converged (zero `defineSchema`, no `eslint-disable`).

Remaining `defineSchema` calls (line numbers vs origin/main at time of writing):

1. **@118** `defineSchema({ topics: canonicalSchema.topics }, { dropExisting: true })`
   — canonical shape, applied via `defineSchema` for shared-table isolation.
2. **@126** `defineSchema({ auto_id_tests: canonicalSchema.auto_id_tests })`
   — canonical shape.
3. **@1094** `defineSchema({ topics, minimalistics, cpk_orders })` (all
   `canonicalSchema.*`) in a `beforeAll` of a `describe("PersistenceTest")` that
   already uses `setupHandlerSuite()` + `useHandlerTransactionalFixtures()`.
4. **@1623** `defineSchema(POSTGRESQL_SPECIFIC_SCHEMA)` (const imported @35) —
   the genuine special case: a PG-only port of Rails
   `vendor/rails/activerecord/test/cases/.../postgresql_specific_schema.rb`
   (uuid-pk `chat_messages` / `chat_messages_custom_pk`, `enableExtension`
   uuid-ossp + pgcrypto, tests `it.skipIf(adapterType !== "postgres")`).

Items 1–3 are canonical shapes applied through `defineSchema` instead of riding
the worker-prebuilt canonical tables — these converge to **zero** `defineSchema`
(the tables already exist via `template-global-setup.ts`; the `dropExisting`
isolation is the shared-table-collision pattern that should be handled by
fixtures, not a re-CREATE). Item 4 is NOT in the canonical `TEST_SCHEMA`.

- trails: `persistence.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/persistence_test.rb` (+ the
  `postgresql_specific_schema.rb` for the uuid-pk block).

## Acceptance criteria

- [ ] Items 1–3: remove the `defineSchema` calls; ride the worker-prebuilt
      canonical `topics`/`auto_id_tests`/`minimalistics`/`cpk_orders` tables via
      `setupHandlerSuite()` + `useHandlerFixtures`/transactional fixtures. Test
      names UNCHANGED.
- [ ] Item 4 (`POSTGRESQL_SPECIFIC_SCHEMA`): port to canonical. Add
      `chat_messages` / `chat_messages_custom_pk` to
      `test-helpers/test-schema.ts` ONLY if Rails `schema.rb` /
      `postgresql_specific_schema.rb` defines them (parity-check first). If they
      are genuinely PG-only fixtures with no canonical home, keep a SINGLE
      scoped, file-unique `defineSchema` + teardown for just those tables and
      document why in a comment — never a shared canonical name, never a broad
      bespoke block. Keep the `skipIf(adapterType !== "postgres")` gating.
- [ ] **File removed from `eslint/require-canonical-schema-exclude.json`** — this
      is the deliverable. `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes on
      sqlite AND postgres (the item-4 block is PG-gated).
- [ ] No new duplicate test names; `node scripts/typecheck.mjs` clean;
      test:compare delta non-negative.

Hard rules: NO `node:*` imports, NO `process.*` refs, async fs only, no new
runtime deps. 500 LOC ceiling. NO stacked PRs — single PR from main.

## Definition of done

`persistence.test.ts` is off the exclude list with zero broad `defineSchema`
(at most one justified, scoped, PG-only fixture exception for item 4) and passes
on both adapters. Leaving the file excluded does NOT close this story.
