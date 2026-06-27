---
title: "relation-trails-canonical"
status: claimed
updated: 2026-06-27
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 82
pr: null
claim: "2026-06-27T17:06:32Z"
assignee: "relation-trails-canonical"
blocked-by: null
---

## Context

`packages/activerecord/src/relation.trails.test.ts` (created in PR #4130, the
RFC 0043 relation-extra-burndown relocation) is grandfathered in
`eslint/require-canonical-schema-exclude.json`. It carries four `defineSchema`
calls with non-canonical tables:

- The `RelationTest` describe `beforeAll` defines `posts`, `developers`,
  `orders`, `books`, `authors`, `comments`, `users`, `eager_comments`,
  `eager_articles`.
- The `Relation#arel build_arel convergence` describe defines `widgets`,
  `gadgets`.

Canonical status (checked against `test-helpers/test-schema.ts`):

- `orders`, `books` — **already in TEST_SCHEMA** → swap to
  `orders: TEST_SCHEMA.orders` etc. (or ride canonical models/fixtures).
- `posts`, `authors`, `comments`, `users`, `developers` — canonical; converge.
- `eager_comments`, `eager_articles`, `widgets`, `gadgets` — **absent** from
  TEST*SCHEMA. These are bespoke fixture tables for eager-load / build_arel SQL
  shape tests. Mirror Rails: either map to canonical analogues (the eager*\* and
  widget/gadget pairs are parent/child collection associations — candidates are
  `authors`/`posts` or `posts`/`comments`) or, if no canonical analogue fits,
  follow the Rails fixture table they mirror.

The tests are pure SQL-generation / `_isDeferredDistinctPkSubquery` assertions
plus a few `build_arel` convergence checks using `setupHandlerSuite` +
`useHandlerTransactionalFixtures`; the table shapes only need the columns the
assertions reference, so canonical models with the right associations should
slot in.

## Acceptance criteria

- `relation.trails.test.ts` uses only canonical `TEST_SCHEMA` tables (no inline
  bespoke table declarations); drop its entry from
  `eslint/require-canonical-schema-exclude.json` (RFC 0019 burndown −1).
- Prefer canonical models (`test-helpers/models/`) + `useHandlerFixtures` over
  raw `defineSchema` where the test exercises real rows.
- Test names unchanged; all tests in the file still pass
  (`pnpm vitest run packages/activerecord/src/relation.trails.test.ts`).
- `eslint` clean on the file with no new exclude-list entries; `test:compare`
  parity metrics for `relation_test.rb` unchanged.
