---
title: "connection-adapters/, adapters/ and sqlite/: resolve 109 novel names, most in files with no Rails counterpart"
status: draft
updated: 2026-08-30
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 400
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

**109 novel names across 47 files** — the largest area, and the one RFC 0119
already has a burndown running through. Coordinate with it: a name 0119 is
about to delete should not get a receipt here.

Notable files:

- `adapters/postgresql/geometric.ts` — 11, no Ruby counterpart file.
  `castPoint`, `parseBox`, `parseCircle`, `parseLine`, `parseLseg`, `parsePath`,
  `parsePoint`, `parsePolygon`, `PgPoint`, `serializePoint`. Rails' equivalents
  live inside `connection_adapters/postgresql/oid/*.rb` type classes, so this is
  plausibly a file-placement problem (route 1: move them onto the OID types
  where Rails puts them) rather than a receipt.
- `connection-adapters/adapter-args.ts` — 5, no counterpart: `AdapterArgs`,
  `adapterNameFromUrl`, `buildAdapterArg`, `normalizeAdapterName`,
  `parseSqliteUrl`. Three of these are duplicated as novel names on
  `connection-handling.ts` too, which suggests one home is wrong.
- `sqlite/better-sqlite3.ts` and `sqlite/node-sqlite.ts` — 4 each, no
  counterpart. Driver shims for two Node SQLite bindings; Rails has one
  `sqlite3` gem and no such layer. Strong `PERMANENT` candidates, and the right
  form is a FILE-level `@noRailsEquivalent` (see `fileTagVerdict`), not 4
  member tags per file. `openSync` is one of the five `*Sync` twins the RFC
  calls out under route 3.
- `connection-adapters/abstract/schema-definitions.ts` — 5 in a MATCHED file:
  `algorithm`, `assertSafeMysqlIdentifier`, `char`, `datetimePhysicalType`,
  `OPTION_NAMES`. A matched file gets no file-level blanket; each of these is
  read against `connection_adapters/abstract/schema_definitions.rb`.
- `connection-adapters/abstract/transaction.ts` — 5, matched:
  `fullyRolledBack`, `rolledBack`, `runAfterCommitCallbacks`,
  `runAfterRollbackCallbacks`, `TransactionCallback`. Rails' `transaction.rb`
  has `#rolledback!` and `#commit_records`; check the naming table before
  assuming these are novel rather than misspelled.

May be split into two PRs (matched files / no-counterpart files) if it exceeds
the LOC ceiling — file them as siblings, do not fan out unfiled.

## Acceptance criteria

- All 109 names resolved by one of the four routes, route stated per file in
  the PR body; no name receipted that RFC 0119 is scheduled to delete.
- No-counterpart driver files use a single FILE-level `@noRailsEquivalent`
  where the blanket is sound, and the extra-surface run accepts it (a rejected
  file-level claim fails the run — see the file-level claim gate).
- `pnpm parity:api:extra --package activerecord --novel-only` shows these files
  at 0 novel; the mark is tightened in the same PR.
- `pnpm parity:api:calls` / `:args` show no new rows, and the three AR adapter
  lanes stay green — moving a helper onto an OID type is exactly the kind of
  change that reds one adapter only.
