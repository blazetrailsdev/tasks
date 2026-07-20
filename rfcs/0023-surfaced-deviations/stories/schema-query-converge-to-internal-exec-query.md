---
title: "Converge schemaQuery onto a real internalExecQuery path, drop the UNWRAPPED_EXECUTE snapshot"
status: ready
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails has no `schema_query`. Each reflection site calls
`internal_exec_query(sql, "SCHEMA")` directly — a real method that
`dirties_query_cache` simply never wraps
(`abstract/database_statements.rb:546-559`, `abstract/query_cache.rb:13`).

trails instead funnels reflection through `AbstractAdapter#schemaQuery`, which
since PR #4977 reads a `UNWRAPPED_EXECUTE` prototype slot populated by
`captureUnwrappedExecute` before `dirtiesQueryCache` wires `execute`
(`connection-adapters/abstract/query-cache.ts`). That reproduces the _behaviour_
(reflection never dirties) but not the structure: it is a stringly-keyed
prototype snapshot standing in for a named method, `schemaQuery` has no Rails
counterpart so `api:compare` cannot map it, and the snapshot must be taken in
the right order or it silently falls back to the wrapped `execute`.

The direct convergence — route reflection through `internalExecQuery` as Rails
does — was attempted in #4977 and reverted: on PG it recurses through
`castResult -> getOidType -> loadAdditionalTypes -> schemaQuery` (104 failed PG
tests). So this is **blocked on**
`pg-cast-result-oid-lookup-reentrancy-guard`; do not retry before that lands.

## Acceptance criteria

- [ ] `pg-cast-result-oid-lookup-reentrancy-guard` landed first — confirm PG no
      longer recurses when a schema query goes through `internalExecQuery`.
- [ ] Reflection sites call an `internalExecQuery`-based path, matching Rails'
      `internal_exec_query(sql, "SCHEMA")`, and `api:compare` maps them.
- [ ] `captureUnwrappedExecute` / `UNWRAPPED_EXECUTE` deleted once nothing reads
      the slot.
- [ ] Row/value semantics unchanged: `Result#toArray()` re-keys raw driver
      values and does not apply `columnTypes`, but verify per adapter rather
      than assuming — reflection currently runs the adapter's real `execute`.
- [ ] The three guards added in #4977 still pass unchanged
      (`query-cache.trails.test.ts` schemaQuery pair,
      `query-cache-ddl-dirties.trails.test.ts`).
- [ ] Verified on live PG and MySQL, not sqlite3 alone — sqlite's `castResult`
      is the identity and cannot see this class of bug.
