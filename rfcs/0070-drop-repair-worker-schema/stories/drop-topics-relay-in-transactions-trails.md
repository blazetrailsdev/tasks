---
title: "Drop the hand-copied canonical topics re-lay in transactions.trails.test.ts"
status: done
updated: 2026-07-25
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5276
claim: "2026-07-24T22:38:54Z"
assignee: "drop-topics-relay-in-transactions-trails"
blocked-by: null
closed-reason: null
---

## Context

Found while removing the four `createTable("items", { force: true })` re-lays in
the same file (#5257, story `restore-items-canonical-table`).

`packages/activerecord/src/transactions.trails.test.ts:79-105` — the
`TransactionTest` describe's `beforeAll` drop-and-recreates the canonical
`topics` table on `Base.connection` with a **hand-copied** duplicate of the
canonical column list (`test-helpers/test-schema.ts:1469`), ~20 `t.string` /
`t.integer` / `t.datetime` calls.

Two problems, both the same class the `items` removal fixed:

- The describe already calls `fixtures({}, { useTransactionalTests: false })`,
  which preloads the canonical schema — so the re-lay is redundant for shape,
  exactly as the `items` ones were.
- The hand-copied column list is a second source of truth for `topics`. It can
  silently drift from `test-schema.ts` (cf.
  `project_two_schema_sources_must_be_edited_together`), and because it runs
  against the shared per-worker DB it is DDL churn on a canonical table — the
  thing RFC 0070 is retiring the repair worker to make unnecessary.

The stated justification is priming the signature cache and shielding against a
sibling file's bespoke `topics`. Both should now be the canonical preload's job;
confirm no sibling still lays a bespoke `topics` before deleting.

## Acceptance criteria

- `topics` re-lay removed from `transactions.trails.test.ts` (or reduced to a
  canonical-loader call — `rebuildCanonicalTables` — with no duplicated column
  list).
- No sibling file left laying a bespoke `topics` shape into the shared worker DB;
  if one exists, it is the thing to fix instead.
- `TransactionTest` passes on sqlite and postgres.
- No test renamed; `test:compare` delta >= 0.
