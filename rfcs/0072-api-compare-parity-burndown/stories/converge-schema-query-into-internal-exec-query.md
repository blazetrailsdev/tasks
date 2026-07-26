---
title: "converge-schema-query-into-internal-exec-query"
status: closed
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of RFC 0076 schema-query-converge-to-internal-exec-query, which is better specified and correctly BLOCKED on pg-cast-result-oid-lookup-reentrancy-guard: the direct route was attempted in #4977 and reverted (104 failed PG tests from castResult -> getOidType -> loadAdditionalTypes -> schemaQuery recursion). Created 2026-07-26 without checking RFC 0076 first; it would have sent someone down a path already proven to fail."
---

## Context

Convergence, not classification. #5345 allowlisted `schemaQuery` on
`connection-adapters/abstract-adapter.ts` with the reason that Rails' equivalent
is "a call convention, not a method". That is accurate — and it is exactly why
the method should not exist.

Rails runs adapter-internal reflection as `internal_exec_query(sql, "SCHEMA")`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:546`).
The `"SCHEMA"` name is what keeps that traffic out of the log (LogSubscriber's
`IGNORE_PAYLOAD_NAMES`) and out of the query cache. There is no
`schema_query` in Rails.

**trails already has the Rails-named method**: `internalExecQuery` is declared
on the `AbstractAdapter` interface at `connection-adapters/abstract-adapter.ts:508`.
So `schemaQuery(sql, binds)` is a trails-only wrapper sitting on top of a method
we already ported under its real Rails name — the convergence is to delete the
wrapper and pass the `"SCHEMA"` name explicitly at each of the **106**
`.schemaQuery(` call sites, exactly as Rails does.

The one thing to preserve deliberately: `schemaQuery`'s body (abstract-adapter.ts,
around :906) does more than name the query. It reaches for a pre-wrap snapshot of
`execute` (`UNWRAPPED_EXECUTE`) so reflection bypasses the dirty-query-cache
wrapper that the `execute`/`executeMutation` split leaves on `execute`. Before
deleting the wrapper, establish that `internalExecQuery` gives the same
cache-bypass guarantee; if it does not, that is a real finding and this story
should stop and report rather than silently reroute reflection through a
cache-dirtying path. This is entangled with RFC 0023
`unify-execute-mutation-into-perform-query` — check whether that should land first.

Verify against the vendored source before starting: read
`abstract/database_statements.rb` around `internal_exec_query` / `exec_query`
and confirm how Rails' own SchemaStatements and SchemaCache call it.

Sequencing: #5345 touches `abstract-adapter.ts`, so start from `main` **after**
PR 5345 merges. Do not stack.

## Acceptance criteria

- `schemaQuery` is removed from `AbstractAdapter`; all 106 call sites use
  `internalExecQuery(sql, binds, "SCHEMA")` (or whatever the verified Rails
  spelling turns out to be).
- The `"SCHEMA"` name still reaches the instrumentation payload — pin it with a
  test that fails if the name is dropped, so reflection cannot silently start
  appearing in `assert_queries_count`-style assertions or the log.
- The query-cache bypass behaviour is preserved and proven, or the story is
  stopped and reported with evidence if `internalExecQuery` cannot provide it.
- The `schemaQuery` entry is DELETED from
  `scripts/api-compare/extra-surface-allow.json`.
- `pnpm typecheck`, `pnpm lint` clean; scoped `vitest run` on the touched files
  passes, including `query-cache-ddl-dirties.trails.test.ts` which pins the
  DDL/cache interaction. MySQL/PG suites need a server; if unavailable locally,
  say so and let CI verify.
