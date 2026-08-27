---
title: "require-table-teardown: flag unbalanced mutations of existing canonical tables"
status: draft
updated: 2026-08-27
rfc: "0019-canonical-schema-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`eslint/require-table-teardown.mjs` balances table **creation** against a drop:
its matcher is `createTable(...)` (bare or on a receiver) plus raw
`CREATE TABLE …` SQL (`require-table-teardown.mjs:4-44`, `:91-112`,
`CREATE_TABLE_RE` at `:337`). It has no notion of a test **mutating a table
that already exists** — `addIndex` / `addColumn` / `changeColumn` against a
canonical table, or `rebuildCanonicalTables(adapter, [...])`, are invisible to
it.

That is the hole the main-CI red at `691f6a0c` came through. The
`UniquenessCoveredByUniqueIndexAdapterResolutionTest` describe in
`packages/activerecord/src/validations/uniqueness-validation.trails.test.ts`
checked out a raw, unpinned adapter, called
`rebuildCanonicalTables(adapter, ["topics"])`, then
`addIndex("topics", "title", { unique: true, name: "topics_direct_index" })`,
and dropped neither. It created no table, so the rule stayed silent. Outside
any fixtures transaction, both mutations outlived the file and reached every
later test on the same worker database; `insert_all` in
`relation/leading-colon-string-writes.trails.test.ts` then failed to land its
row and the suite went red. Fixed in #7109 by removing the DDL entirely
(`subscribers.nick` already carries the unique index), but nothing prevents the
next instance.

The correct discipline already exists one file away, unenforced: the
Rails-mirroring sibling `validations/uniqueness-validation.test.ts` runs
`fixtures(["topics"], { useTransactionalTests: false })` and pays for its 13
`addIndex("topics", "title")` calls with
`afterEach → removeIndex("topics", { name: "topics_index", ifExists: true })`
(`:768-771`). `support/schema-cache-dump.trails.test.ts` does the same in
`try/finally` for all six of its mutations (`:73-77`, `:106-115`, `:124-128`,
`:148-158`). The rule should require what these files already do.

This closes the contamination side of RFC 0079: every `rebuildCanonicalTables`
shield exists because some sibling reshaped a canonical table and never
restored it, so the shields cannot be driven to zero while new sources can land
unflagged. `shield-removal-topics-family` says as much in its own body — "the
uniqueness suite's own addIndex is a contamination source in this very list".

Related rule-hardening stories, neither of which covers this scope:
`require-table-teardown-rule-recognize-loops` (loop/array teardown
false-positives) and, under RFC 0025,
`require-table-teardown-reports-per-call-site-not-per-table-name`.

## Acceptance criteria

- `require-table-teardown` flags a mutation of a pre-existing table that is not
  balanced by its inverse in the same file: `addIndex` ↔ `removeIndex`,
  `addColumn` ↔ `removeColumn`, `renameColumn` ↔ its inverse, and a
  `rebuildCanonicalTables(...)` that is not itself a restore in a teardown
  hook. Matching follows the existing name-based, receiver-agnostic convention
  (`:39-44`), and an `afterEach`/`afterAll`/`finally` restore counts as the
  balance.
- A test that runs under transactional fixtures is exempt — the transaction is
  the teardown. The check must key off the mutation being reachable outside a
  fixtures transaction (raw/unpinned adapter, or
  `useTransactionalTests: false`), not off the call alone, or it fires on every
  correctly-written DDL test in the suite.
- `eslint/require-table-teardown.test.mjs` covers: unbalanced `addIndex` on a
  canonical table (flagged); the `afterEach → removeIndex(… ifExists: true)`
  shape from `uniqueness-validation.test.ts:768-771` (clean); the `try/finally`
  shape from `schema-cache-dump.trails.test.ts:124-128` (clean); a mutation
  under transactional fixtures (clean).
- Whatever the widened rule newly flags is **fixed at the source**, not
  excluded. If a genuine batch falls out, size it as its own burndown story
  rather than widening `require-table-teardown-raw-sql-exclude.json` — the
  exclude list is only-shrink.
- `pnpm lint` clean; no test renames; `parity:test` delta non-negative.
