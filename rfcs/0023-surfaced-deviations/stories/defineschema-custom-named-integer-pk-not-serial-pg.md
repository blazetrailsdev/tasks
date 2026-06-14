---
title: "defineSchema leaves custom-named integer PK sequence-less on PostgreSQL"
status: done
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 3276
claim: "2026-06-14T18:36:37Z"
assignee: "defineschema-custom-named-integer-pk-not-serial-pg"
blocked-by: null
---

## Context

Surfaced while porting `adapter_test.rb`'s `reset empty table with custom pk`
in #3178 (f9d-adapter-querycache-truncate-pkreset).

Rails' `create_table primary_key: "movieid"` makes the custom-named PK a serial
(auto-increment) column. The test-helper `defineSchema` canonical-schema path
creates a custom-named single integer PK **without a sequence/identity on
PostgreSQL**, so `Movie.create(name:)` inserts a null `movieid` and trips a
NOT NULL violation. The same gap forced a manual `createTable` workaround for
`keyboards`/`mixed_case_monkeys` in `primary-keys.test.ts`, and now for `movies`
in `adapter.test.ts` (PG-only `beforeAll` that drops + recreates the table with
`{ primaryKey: "movieid" }`).

Default `id` PKs already become `GENERATED ... AS IDENTITY` on PG; only a
custom-named integer PK declared via `primaryKey: ["col"]` in TEST_SCHEMA misses
the sequence. Fixing `defineSchema` to emit the identity/serial for that case
would let these tests drop their per-file recreation workarounds.

## Acceptance criteria

- [x] `defineSchema` emits an auto-increment/identity column for a custom-named
      single integer PK on PG (and the equivalent on MySQL).
- [x] `movies`/`keyboards`/`mixed_case_monkeys` test workarounds can be removed
      (or are no longer needed) and the affected tests still pass on all adapters.
- [x] `test:compare` delta non-negative.
