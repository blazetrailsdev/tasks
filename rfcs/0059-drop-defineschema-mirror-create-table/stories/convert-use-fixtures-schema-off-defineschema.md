---
title: "convert-use-fixtures-schema-off-defineschema"
status: done
updated: 2026-07-04
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4551
claim: "2026-07-04T15:04:28Z"
assignee: "convert-use-fixtures-schema-off-defineschema"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 (drop-defineschema-mirror-create-table). Follow-up carved out of the
terminal story `retire-defineschema-and-one-schema-apparatus`, which found the
fixtures engine still on `defineSchema`. **Guiding principle: Rails fidelity
above all else.**

Architecture (verified): the public surface `fixtures()`
(`test-helpers/fixtures.ts`) → `useHandlerFixtures()` → `useFixtures()`
(`test-helpers/use-fixtures.ts`) — `useFixtures` is the engine. It lays schema
via `defineSchema` in two places:

- `use-fixtures.ts:276` — `await defineSchema(getAdapter(), sub)` inside
  `useTablelessFixtures`' `{ schema }` `beforeAll`.
- `use-fixtures.ts:478` — `await defineSchema(getAdapter(), sliceSchema(...))`
  inside the main `useFixtures` `{ schema }` `beforeAll`.

`fixtures()` defaults `schema: TEST_SCHEMA`, so this path runs for effectively
every fixtures-using test. The call has _ensure-exists, no-op-if-present_
semantics (relies on the signature-cache dedup): under the template-clone model
the canonical tables already exist, so `defineSchema(sub)` without `dropExisting`
is a near no-op. Neither current canonical primitive is a drop-in:

- `loadCanonicalSchema` (`canonical-schema.ts:2088`) is documented "onto a
  freshly-created (empty) database" — not idempotent over existing tables.
- `rebuildCanonicalTables` (`canonical-schema.ts:2106`) unconditionally
  `dropTable(ifExists)` + recreate — DDL churn, directly against RFC 0060.

Note: `fixtures()` is the endgame surface — new/ported tests always call
`fixtures({ ... })` and never pass `schema` (it defaults to canonical). The
separate `useFixtures` direct-call surface is being retired; see the sibling
story `remove-usefixtures-public-surface`. Prefer `fixtures` in any example.

## Acceptance criteria

- Add an idempotent `ensureCanonicalTables(adapter, names)` primitive to
  `canonical-schema.ts` that creates only the missing named canonical tables
  (no drop of existing ones), or establish that the `{ schema }` `beforeAll` is
  now redundant under template-clone and delete it (letting the boot-time
  template be the sole schema source).
- The fixtures engine no longer calls `defineSchema`.
- `test:compare` delta >= 0; no test renames. NO node:_/process._; async fs only.
