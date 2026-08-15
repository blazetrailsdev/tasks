---
title: "Call recorder attributes mismatches to bodiless interface declarations"
status: blocked
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-08-15T14:14:32Z"
assignee: "call-recorder-matches-bodiless-interface-declarations"
blocked-by: "Premise does not hold: a sweep of all 1196 rows in output/call-mismatches.json against output/ts-api.json finds ZERO rows whose matched TS member is bodiless-only — the extractor already records no `calls` key for MethodSignature/PropertySignature members (extract-ts-api.ts:2318-2337), and compare.ts:2734 returns early when a pair has no candidate call-set, so the proposed 'skip bodiless members' change is a no-op. The 6 exec_insert/exec_delete/exec_update rows on connection-adapters/abstract-adapter.ts are NOT attributed to the bodiless DatabaseStatements signatures at abstract-adapter.ts:604-613. They come from the `DatabaseStatements` defaults object in connection-adapters/abstract/database-statements.ts:1733/1745/1754 (`return this.executeMutation(sql, binds, name)`), which `include(AbstractAdapter, DatabaseStatements)` maps onto abstract-adapter.ts — a real body that really omits sql_for_insert/internal_exec_query/internal_execute/affected_rows. The faithful ports DO exist in the same file (execInsert :603, execDelete :678, execUpdate :695) and already call them. The actual convergence is therefore to point the defaults object at those ported functions (as it already does for `resetTransaction` and `insert: insertStatement`), which is a BEHAVIORAL reshape — execInsert's default would return a Result via internalExecQuery instead of a row count via executeMutation, across every adapter — i.e. RFC 0076 execute-primitive work, not a recorder change. Refile against RFC 0076 with that shape."
closed-reason: null
---

# Call recorder attributes mismatches to bodiless interface declarations

## Context

`wave-3-adapters` (PR #6560) had to baseline 6 of `abstract-adapter.ts`'s 14 rows
as recorder shape rather than converge them:

| Ruby method   | Missing calls                           |
| ------------- | --------------------------------------- |
| `exec_insert` | `sql_for_insert`, `internal_exec_query` |
| `exec_delete` | `internal_execute`, `affected_rows`     |
| `exec_update` | `internal_execute`, `affected_rows`     |

The TS members the recorder matched are **type-only interface declarations** on
the DatabaseStatements surface in
`packages/activerecord/src/connection-adapters/abstract-adapter.ts` (the
`execInsert` / `execDelete` / `execUpdate` signatures). A bodiless declaration
makes no calls by construction, so it can never match a Rails body and the row
can never go green — no matter what anyone writes.

The real ported bodies live in
`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`
and are matched separately; Rails' own definitions are in
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:157-170`
(`exec_insert`), `:186-188` (`exec_update`), `:191-193` (`exec_delete`).

These are permanently-red rows sitting in the ratchet as if they were debt. They
inflate the RFC 0106 in-scope count and mislead whoever claims the file next —
the wave-3 story pointed at RFC 0076 for them, which is the wrong owner because
there is nothing in the _body_ to fix.

Related, already-landed work on declaration-vs-implementation matching lives in
the closed RFC 0080 (`interface-declaration-names-need-a-kind-level-policy`,
`audit-moved-interface-declaration-names`) — the same distinction, applied to
`parity:api` names rather than to the call recorder.

## Converged shape

Teach the call extractor to skip TS members with no body (interface members,
`declare`, overload signatures) when pairing against a Rails method, so the pair
is either matched against the implementing file or not emitted at all. Then drop
the rows the change makes unreachable.

## Acceptance criteria

- [ ] The call recorder does not emit a mismatch for a TS member that has no
      body; a unit test in `scripts/api-compare/` covers an interface-only member.
- [ ] The 6 `exec_insert`/`exec_delete`/`exec_update` rows are deleted from
      `scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract-adapter.json`
      and the mark tightened. No reseed.
- [ ] A sweep reports how many other in-scope rows this class covers across the
      whole baseline, so RFC 0106's remaining count is honest.
- [ ] `pnpm parity:api:calls` green; in-scope count falls and does not rise.
