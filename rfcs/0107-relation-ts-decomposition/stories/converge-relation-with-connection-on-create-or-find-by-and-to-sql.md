---
title: "converge-relation-with-connection-on-create-or-find-by-and-to-sql"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6672
claim: "2026-08-17T22:06:05Z"
assignee: "converge-lock-value-stores-locks-not-clause-string"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by RFC 0108's `precise-call-pairing-key-for-owner-static-and-accessor`.

Until that PR, the same-file call closure in `scripts/api-compare/compare.ts`
resolved the call name `length` — which the TS extractor records off every
`xs.length` PROPERTY read — to the same-file member `Relation#length`
(`packages/activerecord/src/relation.ts:1456`), and from there, three hops on,
to `toArray`'s `withConnection`. Twenty-nine relation.ts bodies were bridged
that way, and two of them were credited with a `with_connection` neither body
makes. `length` is now in `SYNTHETIC_CALL_NAMES`, so the credit is gone and the
two true omissions are visible:

- `Relation#create_or_find_by` — Rails wraps the whole body in
  `with_connection do |connection| … end` (`relation.rb:274-283`) and uses the
  yielded `connection` for the `connection.transaction_open?` branch; trails'
  `createOrFindBy` (`relation.ts:2016-2058`) reads `this._conn()` directly.
- `Relation#to_sql` — Rails' `to_sql` (`relation.rb:...`) goes through
  `with_connection`; trails' `toSql` (`relation.ts:2384`) is SYNCHRONOUS by
  construction (it renders a string with no await), so it takes `this._conn()`.

Both are baselined in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json` under
`rubyName: create_or_find_by | to_sql`, `call: with_connection`, with that
reason. The baseline is a burndown ledger, not permission (CLAUDE.md).

## Acceptance criteria

- `createOrFindBy` routes through `withConnection`, taking the yielded
  connection for the `isTransactionOpen()` branch exactly as `relation.rb:277`
  does — or the story is `tasks block`ed with the specific TS blocker.
- `toSql`: either converge, or block with the sync-render blocker stated at the
  call site as a `@missingRailsCall` tag rather than a baseline row.
- The two `with_connection` rows are deleted from
  `call-mismatches-exclude/activerecord/relation.json` (only-shrink, no
  reseed), then `pnpm parity:api:calls:tighten activerecord/relation.json`.
