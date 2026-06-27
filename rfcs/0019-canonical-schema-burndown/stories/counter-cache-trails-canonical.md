---
title: "counter-cache.trails.test.ts → canonical schema + Rails fixtures"
status: claimed
updated: 2026-06-27
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 150
priority: 78
pr: null
claim: "2026-06-27T15:58:18Z"
assignee: "counter-cache-trails-canonical"
blocked-by: null
---

## Context

`packages/activerecord/src/counter-cache.trails.test.ts` (191 lines, 4 tests,
2 `defineSchema` calls) is the last remaining entry in
`eslint/require-canonical-schema-exclude.json` with **no open conversion
story** — it is the lone coverage gap blocking RFC 0019's exclude list from
reaching zero.

The file holds trails-specific counter-cache guards with no Rails analogue
(deferred counter-cache resolution through the model registry, demodulized
column staging, identity-keyed memo invalidation). It already imports the
canonical helpers (`TEST_SCHEMA as canonicalSchema`, canonical `Post`/`Comment`
models, `setupHandlerSuite`, `useHandlerFixtures`) at
`counter-cache.trails.test.ts:10-18`, but still declares a **bespoke** inline
`TEST_SCHEMA` (`counter-cache.trails.test.ts:20-43`) with bespoke shapes of
`topics`, `replies`, `cpk_orders`, `cpk_books` and feeds it to `defineSchema`,
which violates `blazetrails/require-canonical-schema` (and the
defineSchema-canonical-only rule in CLAUDE.md).

The behaviours under test are legitimately trails-only and stay (this is not a
delete), but they must ride the canonical `TEST_SCHEMA` + Rails fixtures rather
than a bespoke schema — mirror the pattern already used by the merged
`relation-trails-canonical` story for `relation.trails.test.ts`.

## Acceptance criteria

- The inline bespoke `TEST_SCHEMA` is removed; the suite runs on the canonical
  `TEST_SCHEMA` (`test-helpers/test-schema.js`) via `setupHandlerSuite` /
  `useHandlerFixtures` on canonical tables and the official models in
  `test-helpers/models/`. Any table/column the trails guards need that the
  canonical schema lacks is added to the canonical schema, not re-declared
  inline.
- All 4 trails-specific tests still pass (sqlite/postgres/mysql) with their
  names unchanged.
- `counter-cache.trails.test.ts` is removed from
  `eslint/require-canonical-schema-exclude.json` in the same PR, and lint
  passes with the entry gone.
- PR stays under the 500-LOC ceiling (the file is small; this should be a
  single PR).
