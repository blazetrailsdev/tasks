---
title: "Guard PG castResult/getOidType reentrancy so reflection cannot recurse"
status: ready
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`postgresql/database-statements.ts` `castResult` resolves every field's OID via
`PostgreSQLAdapter#getOidType` (postgresql-adapter.ts:832), which on a type-map
miss calls `loadAdditionalTypes` (postgresql-adapter.ts:1098) — and that calls
`schemaQuery`. Any path that routes a schema query through `internalExecQuery`
therefore closes a cycle:

```text
schemaQuery -> internalExecQuery -> castResult -> getOidType
  -> loadAdditionalTypes -> schemaQuery -> ...
```

PR #4977 hit this and measured it: 104 failed PG tests / 74 failed suites, every
OID, type-map, extension and enum test timing out at 5s. It shipped around the
cycle (reflection now uses an unwrapped `execute` snapshot) rather than fixing
it, so the hazard is still live for any future caller.

Rails does not recurse here because `initialize_type_map` preloads the common
OIDs at connect, so `get_oid_type` for pg_type's own columns (oid/name/bool/text)
never misses (`postgresql_adapter.rb` `initialize_type_map`). trails populates
the map lazily, so the reentrancy is reachable.

Note the guard must NOT register a fallback on the type map: the comment at
postgresql-adapter.ts:880-890 explains that registering a ValueType on miss
poisons the map (subsequent `getOidType` sees `has(oid)=true`, skips
`loadAdditionalTypes`, never resolves the real type).

## Acceptance criteria

- [ ] A reentrancy guard so a schema query issued _during_ `loadAdditionalTypes`
      cannot re-enter it — without registering a poisoning fallback type.
- [ ] Consider preloading the OIDs Rails' `initialize_type_map` preloads, which
      removes the miss entirely and is the more faithful fix.
- [ ] A regression test that fails on the recursion: route a reflection read
      through `internalExecQuery` against PG with a cold type map and assert it
      completes (the pre-fix behaviour is a 5s timeout, not an error).
- [ ] Verify on a live PG (the sqlite3 suite cannot see this — its `castResult`
      is the identity, `sqlite3/database-statements.ts:246`).
