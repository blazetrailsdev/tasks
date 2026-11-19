---
title: "pg: singleton escapers follow libpq's static_std_strings"
status: draft
updated: 2026-11-19
rfc: "0186-pg-gem-port"
cluster: null
packages: []
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

- `packages/pg/lib/connection.ts` singleton `escapeString` / `escapeBytea` treat `standard_conforming_strings` as always off (libpq's initial `static_std_strings = false`).
- libpq updates `static_std_strings` from every connection's ParameterStatus (`pqSaveParameterStatus`, fe-exec.c), so `PG::Connection.escape_string` / `.escape_bytea` (`vendor/pg/v1.5.9/ext/pg_connection.c:1629,1683`) follow the last connection opened in the process.
- `packages/pg/lib/engine/node-pg.ts` `listen` already sees each `parameterStatus` message.

## Acceptance criteria

- [ ] A module-level `static_std_strings` in the pg package is set by the engine's `parameterStatus` listener for `standard_conforming_strings`, and both singleton escapers read it.
- [ ] A test in `packages/pg` pins singleton output before and after a connection reports `standard_conforming_strings=on`.
