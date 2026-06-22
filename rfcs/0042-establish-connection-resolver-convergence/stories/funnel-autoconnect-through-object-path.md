---
title: "Funnel autoConnect through the single DatabaseConfig object path"
status: claimed
updated: 2026-06-22
rfc: "0042-establish-connection-resolver-convergence"
cluster: null
deps: ["route-establish-connection-string-hash-through-resolver"]
deps-rfc: []
est-loc: 100
priority: 20
pr: null
claim: "2026-06-22T11:31:57Z"
assignee: "funnel-autoconnect-through-object-path"
blocked-by: null
---

## Context

After the string/hash branch is converged
(`route-establish-connection-string-hash-through-resolver`), the `undefined`
branch (`autoConnect`, `connection-handling.ts:799-859`) is the last fork.
`autoConnect` already builds a `DatabaseConfig` from `configurations`
(`primaryConfigs[0] ?? configs.findDbConfig(env)`) but then re-derives
adapter/url and rebuilds a fresh config inside `establishWithConfig` rather than
handing the resolved object straight to the handler.

Rails has no separate no-arg path: `config_or_env ||= DEFAULT_ENV.call.to_sym`
then the same `resolve_config_for_connection` funnel
(`connection_handling.rb:50-53`).

## Acceptance criteria

- [ ] `autoConnect` routes its resolved `DatabaseConfig` through the single
      object funnel (`establishWithDbConfig`/shared path) instead of rebuilding
      via `establishWithConfig`.
- [ ] After this story, `establishWithDbConfig` is the core of
      `establishConnection` for all three input kinds; the in-memory
      `configurations` handling (`connection-handling.ts:805-820`) is preserved.
- [ ] api:compare + test:compare delta non-negative.
