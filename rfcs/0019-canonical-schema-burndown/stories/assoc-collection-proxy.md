---
title: "Port collection-proxy.test.ts to canonical schema"
status: done
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 300
priority: 38
pr: 3754
claim: "2026-06-26T04:47:48Z"
assignee: "assoc-collection-proxy"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Convert `packages/activerecord/src/associations/collection-proxy.test.ts`
(~522 LOC, 7 inline tables) onto the canonical schema.

- trails: `associations/collection-proxy.test.ts`
- Rails: **no 1:1 counterpart.** `CollectionProxy` behaviour is exercised in
  Rails across `has_many_associations_test.rb` and
  `collection_proxy_*`/`associations_test.rb` rather than a single file.

Because there is no single Rails source file, **fidelity step 4 (body
word-for-word) does not apply**. The bar reduces to steps 1–3: ride
`TEST_SCHEMA` + canonical `Author`/`Post`/`Comment` models + fixtures, with no
inline tables. Where a test mirrors a specific Rails case, match that case and
keep the name.

## Acceptance criteria

- [ ] **Converged setup, not `defineSchema`:** wire the file with
      `setupHandlerSuite()` + `useHandlerFixtures([...])` (Rails `fixtures :name`);
      load rows via `name(:label)` registry lookups. The canonical tables are
      pre-built once per worker by `template-global-setup.ts`, so a converged
      file calls `defineSchema` **zero** times and constructs no
      `createTestAdapter`.
- [ ] No `defineSchema` left in the file. If a needed column has no canonical
      home, add it to `test-helpers/test-schema.ts` ONLY when Rails `schema.rb`
      has it (parity-check first); otherwise keep a single scoped, file-unique
      `defineSchema` + teardown for that one table (never the shared name).
- [ ] Use canonical `Author`/`Post`/`Comment`; rows via `fixtures` +
      `name(:label)`.
- [ ] Test names unchanged; where a body mirrors a Rails case, match it.
- [ ] File removed from the exclude JSON; `pnpm lint` clean, no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/collection-proxy.test.ts`
      passes (co-run colliding siblings under `maxForks=1`).

## Definition of done

Riding the canonical schema + fixtures with no inline tables. An
`eslint-disable` or leaving the file excluded does **not** close this story.
