---
title: "assertions-tail-adapters-1-remainder-2-pg-uuid-assertions"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7939
claim: "2026-09-21T21:01:17Z"
assignee: "assertions-tail-adapters-1-remainder-2-pg-uuid-assertions"
blocked-by: null
closed-reason: null
---

## Context

Split from `assertions-tail-adapters-1-remainder-2` (PG lane). `adapters/postgresql/uuid_test.rb`
still reports 13 count / 16 kind mismatches under
`pnpm parity:test -- --package activerecord --assertions --missing`. Trails'
`packages/activerecord/src/adapters/postgresql/uuid.test.ts` (1071 lines) builds bespoke
`CREATE TABLE`s; the canonical `uuid_data_type` / `uuid_type` tables live in
`vendor/rails/activerecord/test/schema/postgresql_specific_schema.rb`, with the `UUIDType` model beside
them. Runs locally with `ARCONN=postgresql PGPORT=55432 PGUSER=postgres`.

## Acceptance criteria

- `uuid_test.rb` reports 0 count/kind/value mismatches.
- Bodies port the Rails bodies over the canonical tables/models; use `assert`,
  `assertNothingRaised`, `assertRaises` from `@blazetrails/activesupport` where Rails uses them.
