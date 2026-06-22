---
title: "Route establishConnection string/hash branch through resolveConfigForConnection"
status: in-progress
updated: 2026-06-22
rfc: "0042-establish-connection-resolver-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: 3860
claim: "2026-06-22T02:51:56Z"
assignee: "route-establish-connection-string-hash-through-resolver"
blocked-by: null
---

## Context

Rails `establish_connection` resolves the `string | hash | symbol` argument to a
`DatabaseConfig` via `resolve_config_for_connection`, then calls the handler with
that object (`connection_handling.rb:50-53`).

trails forks the `string | hash` branch through bespoke `resolveConfig`
(`connection-handling.ts:861`) + `establishWithConfig`, which constructs its own
`UrlConfig`/`HashConfig` (`connection-handling.ts:770-773`) instead of reusing a
resolved object. The faithful resolver `resolveConfigForConnection`
(`connection-handling.ts:1019`, mirrors `resolve_config_for_connection`) already
exists and is used by `connectsTo` (line 90) — but not by `establishConnection`.

RFC 0023's `establish-connection-accepts-databaseconfig-object` added the
`DatabaseConfig` branch (`establishWithDbConfig`, line 715) that demonstrates the
target: resolve → object → handler verbatim.

## Acceptance criteria

- [ ] The `string | hash` branch of `establishConnection`
      (`connection-handling.ts:673-676`) resolves via `resolveConfigForConnection`
      → `DatabaseConfig`, then funnels through the single object path
      (`establishWithDbConfig`/the shared helper).
- [ ] Bespoke `resolveConfig` (`connection-handling.ts:861`) is deleted.
- [ ] `validateConfigDefaultTimezone` tz handling and `buildAdapterArg` preserved.
- [ ] api:compare + test:compare delta non-negative.
