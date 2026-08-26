---
title: "route-remaining-default-env-call-sites"
status: draft
updated: 2026-08-26
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
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

`DEFAULT_ENV` now exists at the Rails name in
`packages/activerecord/src/connection-handling.ts` (mirroring
`vendor/rails/activerecord/lib/active_record/connection_handling.rb:7`) and
`establishConnection` calls it (`connection_handling.rb:51`), landed with
`converge-establish-connection-default-env-funnel`.

The three OTHER Rails `DEFAULT_ENV.call` sites still re-derive the value
through `DatabaseConfigurations.currentEnv()` instead of calling it:

- `database_configurations.rb:188-190` → `DatabaseConfigurations.currentEnv()`
  (`packages/activerecord/src/database-configurations.ts:125`)
- `database_configurations/database_config.rb:91-93` →
  `DatabaseConfig#forCurrentEnv` reads the module-local `_defaultEnvGetter`
  (`packages/activerecord/src/database-configurations/database-config.ts:37,146`)
- `migration.rb:1340-1342` → `MigrationContext#currentEnvironment`
  (`packages/activerecord/src/migration.ts:2008`)

Each carries a call-set baseline row for the dropped `call` in
`scripts/api-compare/call-mismatches-exclude/activerecord/{database-configurations,database-configurations/database-config,migration}.json`.

The blocker is module-eval order, not naming: `connection-handling.ts` statically
imports `database-configurations.js` (`connection-handling.ts:5`) plus
`base.js`, `core.js` and `connection-adapters.js`, so a static import edge back
from `database-configurations.ts` / `database-config.ts` into
`connection-handling.ts` closes a cycle whose participants include
`class HashConfig extends DatabaseConfig` — exactly the TDZ shape
`_setDefaultEnvGetter`'s own comment (`database-config.ts:39-45`) was introduced
to avoid. Converging needs a module-graph decision (relocate the env-resolution
state into a zero-import leaf, per CLAUDE.md's "Call-time constant resolution"
section, and let `DEFAULT_ENV` and all four readers sit over it), verified with a
plain-node import of the BUILT `dist/**.js` modules as entry modules — a vitest
run enters the funnel module first and masks the TDZ.

## Acceptance criteria

- [ ] The env-resolution state (`DatabaseConfigurations._defaultEnv` and the
      `TRAILS_ENV` / `NODE_ENV` chain) lives somewhere both `connection-handling.ts`
      and `database-config.ts` can reach without closing a module-eval cycle.
- [ ] `_defaultEnvGetter` / `_setDefaultEnvGetter` are deleted.
- [ ] The three sites above reach the environment through `DEFAULT_ENV`.
- [ ] The three `| call` rows are deleted from the exclude tree by hand via
      `serializeBaseline`, then `pnpm parity:api:calls:tighten` on the affected shards.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green.
- [ ] A plain-node import of the built `dist` entry modules for
      `connection-handling.js`, `database-configurations.js` and
      `database-configurations/database-config.js` each succeed in their OWN process.
