---
title: "Eliminate the arel default quoters — every visitor supplies a connection, as Rails does"
status: draft
updated: 2026-07-14
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' Arel visitors **always** have a `@connection`: `ToSql#initialize(connection)`
stores it, and every quoting decision delegates to it (`quote` →
`@connection.quote`, `to_sql.rb:867-870`; likewise `quote_table_name` /
`quote_column_name` / `sanitize_as_sql_comment`). Rails has **no** default or
fallback quoter — the concept does not exist in `arel/visitors/`.

trails constructs visitors with **no connection** in ~451 sites across
`packages/arel` and `packages/activerecord` (e.g. `new Visitors.PostgreSQL()`
throughout `packages/arel/src/visitors/postgres.test.ts`, and production code at
`packages/arel/src/tree-manager.ts` for the `Node#toSql()` debug path). To serve
those, trails invented the quoting hosts in
`packages/arel/src/visitors/default-quoter.ts` (`defaultQuoter`,
`mysqlDefaultQuoter`, `postgresqlDefaultQuoter`) plus
`packages/arel/src/quote-array.ts` (`quoteArrayLiteral` + its `formatElement`
hook) — 359 LOC with no Rails analogue, which re-implement adapter quoting that
`packages/activerecord/src/connection-adapters/*/quoting.ts` already owns.

PR #4868 (story `arel-quote-delegates-to-connection-like-rails`) converged the
**structure** — `ToSql#quote` is now Rails' two-line delegation, the PG `quote`
override is gone, and `quotedDate` left the visitor. Its acceptance criteria
allowed the residue to stay as "a documented minimal quoting host", and it took
that option because the connection-less call sites made full convergence a
separate refactor. Per _always converge, never ratify_, this story is that
convergence rather than a ratification of the residue.

Note #4035 (`drop-default-quoter-production-reliance`, RFC 0007) already dropped
**production** reliance for activerecord's value quoting; what remains is the
test/debug surface plus `tree-manager.ts`, so this is the RFC 0007 endgame.

Related residue that dies with the hosts: `quoteArrayLiteral` quotes array
elements **by type** where the pg gem quotes **by content** (story
`converge-arel-array-string-elements-to-content-based-quoting`), and array
booleans use `quoted_*` where Rails uses `unquoted_*` (story
`converge-arel-array-booleans-to-unquoted-true`). Both become moot once the
adapter's `encode_array` is the only array path.

## Scope warning

~451 construction sites + 359 LOC of deletions **exceeds the 500-LOC PR ceiling**
as a single change. It needs phasing — suggested split: (1) `tree-manager.ts` /
production `Node#toSql()` decides its host explicitly, (2) `packages/arel` tests
supply a quoter, (3) `packages/activerecord` tests supply the real adapter,
(4) delete `default-quoter.ts` + `quote-array.ts` + tests. Triage should split
before claiming.

## Acceptance criteria

- [ ] Arel visitor construction sites supply a connection (a real adapter, or an
      explicit in-test stub quoter), so no caller depends on an implicit default.
- [ ] `packages/arel/src/visitors/default-quoter.ts` and
      `packages/arel/src/quote-array.ts` are deleted once no caller remains.
- [ ] The `PostgreSQL` visitor's constructor (Rails has none —
      `arel/visitors/postgresql.rb`) is removed with the default it exists to name.
- [ ] `Node#toSql()`'s debug path either supplies an explicit quoter or is
      documented with the Rails anchor for why it must differ.
- [ ] No arel-side re-implementation of adapter quoting remains.
- [ ] api:compare / test:compare delta non-negative.
