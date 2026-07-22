---
title: "delete-arel-default-quoters-and-constructor-defaults"
status: done
updated: 2026-07-22
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps:
  - convert-remaining-arel-visitor-sites-to-explicit-connection
  - converge-node-tosql-to-table-engine-connection
deps-rfc: []
est-loc: 300
priority: null
pr: 5067
claim: "2026-07-22T17:41:48Z"
assignee: "delete-arel-default-quoters-and-constructor-defaults"
blocked-by: null
closed-reason: null
---

## Context

Final phase of RFC 0007, after
`convert-remaining-arel-visitor-sites-to-explicit-connection` and
`converge-node-tosql-to-table-engine-connection`.

Once every call site names its connection, delete the invention:

- `packages/arel/src/visitors/default-quoter.ts` (332 LOC)
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
   while `packages/arel` has its own suite.

   **Decided shape** (pinned in #5032 review): _move_ `default-quoter.ts` into
   `packages/arel/src/test-helpers/`, keeping the bodies as-is, and surface it as
   `testConnection`. Do NOT hand-write a fresh minimal quoter. A rewrite would be
   a second invention with no Rails analogue, and it would silently break #5008's
   `array-encode-parity.trails.test.ts`, which pins the PG quoter's output
   byte-for-byte against `OID::Array#encode` — a hand-rolled replacement would
   have to re-derive those bytes with nothing anchoring it. The move is
   behaviour-preserving and testable; the rewrite is not.

   Consequence to state plainly in that PR: `testConnection` is a **permanent**
   test-only stub, not a transitional one, for as long as `packages/arel` ships
   its own suite. What RFC 0007 eliminates is the _production_ surface — the
   constructor defaults and the implicit fallback — not the existence of a test
   connection. Rails' equivalent is `Table.engine.lease_connection`; ours is a
   stub only because of the package split.

2. `quote-array.ts` is **split out** into
   `delete-arel-quote-array-adapter-owns-array-encoding` — it was originally
   bundled here, but the pair exceeded the 500-LOC ceiling. #5008 added
   `array-encode-parity.trails.test.ts`, which pins arel's
   `postgresqlDefaultQuoter` byte-for-byte against `OID::Array#encode` — it
   deliberately depends on the duplication existing. Deleting `quote-array.ts`
   means that parity test either dies with it or is repointed. Sibling stories
   `converge-arel-array-string-elements-to-content-based-quoting` and
   `converge-arel-array-booleans-to-unquoted-true` become moot once the adapter's
   `encode_array` is the only array path.

## Acceptance criteria

- [ ] `default-quoter.ts` no longer exists on the production
      surface; any surviving stub is test-only and documented with its Rails anchor.
- [ ] No visitor constructor supplies a default connection.
- [ ] `PostgreSQL` has no constructor.
- [ ] `array-encode-parity.trails.test.ts` is repointed or removed with a stated rationale.
- [ ] api:compare / test:compare delta non-negative.
