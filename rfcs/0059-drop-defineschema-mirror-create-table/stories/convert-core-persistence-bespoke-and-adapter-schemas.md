---
title: "convert-core-persistence-bespoke-and-adapter-schemas"
status: claimed
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: "2026-07-03T12:09:51Z"
assignee: "convert-core-persistence-bespoke-and-adapter-schemas"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 Phase 3 follow-up. The parent story
`convert-bespoke-defineschema-core-persistence` shipped the low-risk plain
canonical-ride deletions. This story covers the files whose `defineSchema` is
**load-bearing on a non-boot adapter** or lays a **genuinely bespoke schema** —
neither is a boot-schema no-op, so each needs a real `create_table` conversion.

Files:

- `persistence.test.ts` — `defineSchema(POSTGRESQL_SPECIFIC_SCHEMA)` inside a
  postgres-only block (chat_messages / chat_messages_custom_pk, uuid PKs via
  `uuid_generate_v4()`). Genuinely bespoke — mirror
  `vendor/rails/activerecord/test/schema/postgresql_specific_schema.rb` with real
  `connection.createTable(...)` + teardown drop.
- `transaction-instrumentation.test.ts` — `freshIsolatedAdapter()` news a
  `new BetterSQLite3Adapter(":memory:")` then `defineSchema(adapter, {topics})`.
  The boot loader did NOT run on this fresh adapter, so the call is load-bearing:
  replace with `adapter.createTable("topics", ...)` mirroring schema.rb's topics
  (or a Phase-1 `loadCanonicalSchema(adapter)` call).
- `transactions.trails.test.ts` — `defineSchema` on `createTestAdapter()` wrapper
  adapters (topics; items x4). These wrappers share the boot DB but carry their
  own signature cache, so the calls act as a shield. Convert per the wrapper
  semantics (createTable on the wrapper, or drop the call if the shared boot
  table suffices — verify no shape-drift flake).
- `persistence/reload-association-cache.test.ts` — `defineSchema(adapter, {...})`
  on a `createTestAdapter()` wrapper (publications/editorships/editors). Same
  wrapper-adapter treatment as transactions.trails.

## Acceptance criteria

- Every `defineSchema(...)` in the listed files replaced by a real
  `connection.createTable(...)` (bespoke schema mirrored from Rails; or canonical
  rebuild on the fresh/wrapper adapter) + teardown drop where a table is created.
- `git grep -c "defineSchema(" <these files>` -> 0.
- No test renames; `test:compare` delta >= 0. Tests pass on all 3 adapters
  (persistence PG block runs only on postgres).
- <=500 LOC per PR; non-overlapping files if split; do NOT stack.
