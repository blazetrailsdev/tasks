---
title: "delete-arel-default-quoters-and-constructor-defaults"
status: ready
updated: 2026-07-21
rfc: "0007-remove-global-arel-visitor"
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

Final phase of RFC 0007, after
`convert-remaining-arel-visitor-sites-to-explicit-connection` and
`converge-node-tosql-to-table-engine-connection`.

Once every call site names its connection, delete the invention:

- `packages/arel/src/visitors/default-quoter.ts` (332 LOC)
- `packages/arel/src/quote-array.ts` (141 LOC) + `quote-array.test.ts`
- the `ArelConnection` constructor defaults on `ToSql` (`visitors/to-sql.ts:170`),
  `MySQL` (`visitors/mysql.ts:14`), and `PostgreSQL` (`visitors/postgresql.ts:21`)
- the `PostgreSQL` constructor entirely — Rails' `arel/visitors/postgresql.rb`
  declares none; it exists only to name the default

Rails has no analogue for any of it: `ToSql#initialize(connection)` stores the
connection and every quoting decision delegates to it (`to_sql.rb:867-870`).

**Two constraints this story must resolve, discovered in #5032:**

1. `@blazetrails/activerecord` depends on `@blazetrails/arel`, so arel-side tests
   cannot import a real adapter without a circular dependency — Rails has no such
   constraint (one gem). `default-quoter.ts` therefore cannot be deleted outright
   while `packages/arel` has its own suite; it collapses into
   `test-helpers/connection.ts` as an explicitly test-only stub, off the
   production surface. Decide and document that shape here.
2. #5008 added `array-encode-parity.trails.test.ts`, which pins arel's
   `postgresqlDefaultQuoter` byte-for-byte against `OID::Array#encode` — it
   deliberately depends on the duplication existing. Deleting `quote-array.ts`
   means that parity test either dies with it or is repointed. Sibling stories
   `converge-arel-array-string-elements-to-content-based-quoting` and
   `converge-arel-array-booleans-to-unquoted-true` become moot once the adapter's
   `encode_array` is the only array path.

## Acceptance criteria

- [ ] `default-quoter.ts` and `quote-array.ts` no longer exist on the production
      surface; any surviving stub is test-only and documented with its Rails anchor.
- [ ] No visitor constructor supplies a default connection.
- [ ] `PostgreSQL` has no constructor.
- [ ] `array-encode-parity.trails.test.ts` is repointed or removed with a stated rationale.
- [ ] api:compare / test:compare delta non-negative.
