---
title: "Function, aggregate and authorizer hooks on the libsql and expo-sqlite engines"
status: done
updated: 2026-11-26
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 4
pr: trails#10776
claim: "2026-11-26T01:45:14Z"
assignee: "sqlite3-expo-engine-busy-retry-on-the-gem-layer"
blocked-by: null
closed-reason: null
---

## Context

trails#10694 ported `SQLite3::Database#create_function`, `define_function_with_flags`,
`define_aggregator2` and `authorizer=` (`vendor/sqlite3/v2.7.3/lib/sqlite3/database.rb`,
`ext/sqlite3/database.c`) through optional `EngineDatabase` hooks
(`packages/sqlite3/lib/database.ts`). Only the better-sqlite3 and node:sqlite engines
implement them; `packages/sqlite3/lib/engine/libsql.ts` and `lib/engine/expo-sqlite.ts`
implement only `dbFilename` / `libversion`, so on those engines the methods cannot register.

## Acceptance criteria

- libsql and expo-sqlite engines implement `defineFunctionWithFlags`, `defineAggregator2`
  and `setAuthorizer` where the driver exposes the capability, else raise the gem's
  error at the call (`NotImplementedError`-shaped, as `load_extension` does).
- `test/test-integration-aggregate.test.ts` passes against each engine that supports it.
