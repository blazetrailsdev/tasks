---
title: "three-levels-config-through-find-db-config"
status: ready
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5492 ports `test_establish_connection_using_3_levels_config` into
`packages/activerecord/src/connection-adapters/connection-handler.test.ts`, but
routes around `DatabaseConfigurations#findDbConfig` and resolves its configs
through `configsFor` instead, because `findDbConfig`'s first pass was gated on a
broken `DatabaseConfig#forCurrentEnv`.

That gate is fixed: `DatabaseConfigurations.currentEnv()` now honours an
explicitly set `defaultEnv` ahead of `TRAILS_ENV` / `NODE_ENV`, mirroring Rails'
`ConnectionHandling::RAILS_ENV` (`Rails.env` first) — see
`packages/activerecord/src/database-configurations.ts` and the regression test
`forCurrentEnv follows an explicitly set defaultEnv over the process env` in
`database-configurations.test.ts`.

The workaround could not be removed in that fix's PR because #5492 was still
open and we do not stack PRs.

Rails reference:
`vendor/rails/activerecord/test/cases/connection_adapters/connection_handler_test.rb:33-63`
(sets `ENV["RAILS_ENV"] = "default_env"`, then `@handler.establish_connection(:primary)`).

## Acceptance criteria

- [ ] After #5492 merges, `connection-handler.test.ts`'s "establish connection
      using 3 levels config" resolves its configs through `findDbConfig`
      (via `establishConnection(:name)`), as Rails does — not `configsFor`.
- [ ] No test names change.
