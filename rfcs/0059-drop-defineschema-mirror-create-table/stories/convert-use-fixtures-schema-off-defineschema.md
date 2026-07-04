---
title: "convert-use-fixtures-schema-off-defineschema"
status: ready
updated: 2026-07-04
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). Follow-up carved out of the
terminal story `retire-defineschema-and-one-schema-apparatus`, which found the
hot fixtures loader still on `defineSchema`. **Guiding principle: Rails fidelity
above all else.**

`use-fixtures.ts` still lays schema via `defineSchema` in two places:

- `packages/activerecord/src/test-helpers/use-fixtures.ts:276` —
  `await defineSchema(getAdapter(), sub)` in the `{ schema }` `beforeAll` path.
- `packages/activerecord/src/test-helpers/use-fixtures.ts:478` —
  `await defineSchema(getAdapter(), sliceSchema(fixtures, fullSchema))`.

These are depended on by **104 test files** passing `{ schema: TEST_SCHEMA }`
(aliased `canonicalSchema`) to `fixtures()` / `useFixtures()`. The call has
_ensure-exists, no-op-if-present_ semantics (relies on the signature-cache
dedup): under the template-clone model the canonical tables already exist, so
`defineSchema(sub)` without `dropExisting` is a near no-op. Neither current
canonical primitive is a drop-in:

- `loadCanonicalSchema` (`canonical-schema.ts:2088`) is documented "onto a
  freshly-created (empty) database" — not idempotent over existing tables.
- `rebuildCanonicalTables` (`canonical-schema.ts:2106`) unconditionally
  `dropTable(ifExists)` + recreate — DDL churn, directly against RFC 0060.

## Acceptance criteria

- Add an idempotent `ensureCanonicalTables(adapter, names)` primitive to
  `canonical-schema.ts` that creates only the missing named canonical tables
  (no drop of existing ones), or establish that the `{ schema }` `beforeAll` is
  now redundant under template-clone and remove it + the `schema:` option
  surface across the 104 callers.
- `use-fixtures.ts` no longer calls `defineSchema`.
- `test:compare` delta >= 0; no test renames. NO node:_/process._; async fs only.
