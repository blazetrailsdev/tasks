---
title: "Call recorder attributes mismatches to bodiless interface declarations"
status: closed
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise refuted by the blocker investigation and out of this RFC's charter. A sweep of all call-mismatches rows found zero attributable to bodiless members — extract-ts-api.ts records no calls key for MethodSignature/PropertySignature, and compare.ts returns early with no candidate call-set, so the proposed 'skip bodiless members' change is a no-op. The 6 exec_insert/exec_delete/exec_update rows come from the DatabaseStatements defaults object (connection-adapters/abstract/database-statements.ts:1733/1745/1754), and the real convergence is repointing those defaults at the ported execInsert/execDelete/execUpdate — a behavioural execute-primitive reshape, i.e. RFC 0076 work, not a recorder change. Refile against 0076 with that shape."
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
