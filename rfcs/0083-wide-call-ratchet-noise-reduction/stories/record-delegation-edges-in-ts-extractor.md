---
title: "Record delegation edges (accessor forwarding) in extract-ts-api"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5730
claim: "2026-07-31T18:11:58Z"
assignee: "record-delegation-edges-in-ts-extractor"
blocked-by: null
closed-reason: null
---

## Context

Filed by `audit-wide-cross-file-mixin-attribution` (PR #5725). See
`rfcs/0083-wide-call-ratchet-noise-reduction/cross-file-audit.md`.

The audit measured that the recorded include/extends graph resolves only **28**
of the 5034 wide (row, call) pairs, because 73% of flagged rows sit in a TS file
that declares no include/extends edge at all. trails does not mix
`PostgreSQL::SchemaStatements` into `PostgreSQLAdapter`; it puts the port in
`PostgreSQLSchemaStatements`
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts:99`)
and reaches it from
`connection-adapters/postgresql-adapter.ts:3777-3779` with
`return this.pgSchemaStatements().indexes(tableName)` — a **delegation edge**,
which `extract-ts-api.ts` does not record. `PostgreSQLAdapter`'s recorded
`includes` is exactly `["DatabaseAdapter"]`.

This is the only mechanism the audit found that reaches the bucket RFC 0083
actually described. The name-only alternatives are unsound: they credit
`abstract-mysql-adapter.ts` with calls made in
`postgresql/schema-statements-class.ts`, and `cache/file-store.ts` with
`cache/memory-store.ts` — sibling implementations of one interface, exactly the
per-adapter fidelity gaps the gate exists to catch.

## Acceptance criteria

- `extract-ts-api.ts` records, per method, the delegation edge of a body whose
  whole content forwards to another object's same-named method
  (`return this.<accessor>().<name>(...)`), resolving `<accessor>`'s return type
  to the declaring class/module via the checker — not by filename proximity.
- The edge is recorded alongside `includes`/`extends` in `ts-api.json` and
  covered by an `extract-ts-api.test.ts` case using the
  `PostgreSQLAdapter` → `PostgreSQLSchemaStatements` shape.
- No consumer behaviour change in this story: `compare.ts` is untouched and the
  wide baseline is unchanged (delta 0). Consuming the edge belongs to
  `resolve-wide-candidates-through-include-graph`.
- The PR body reports how many wide rows the new edge WOULD resolve, measured
  with `scripts/api-compare/audit-cross-file-calls.ts`, so the sibling story can
  be re-scoped against a real number rather than the RFC's projection.
