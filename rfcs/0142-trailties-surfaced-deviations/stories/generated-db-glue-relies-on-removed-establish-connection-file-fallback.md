---
title: "ar's generated db.ts and the twitter-clone example call establishConnection() expecting the removed config-file fallback"
status: in-progress
updated: 2026-09-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8198
claim: "2026-09-27T23:04:27Z"
assignee: "engine-called-from-never-seated"
blocked-by: null
closed-reason: null
---

## Context

Found while verifying the READMEs (2026-09-27, main `b4f622ae87`). Filed under
0142 because no activerecord / activerecord-cli bucket is active.

trails#6777 (`establish-connection-no-arg-must-not-read-config-files`) made
no-arg `Base.establishConnection()` resolve only through the global
`configurations` registry, as Rails' does
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_handling.rb:50-54`).
Two user-facing bootstraps still assume the old file fallback, and both now
fail with an empty registry:

- `ar init` / `ar new` write `db.ts` from `DB_GLUE`
  (`packages/activerecord-cli/src/init.ts:32-47`), whose `connect()` is a bare
  `await Base.establishConnection()`. Its JSDoc says this "reads
  `config/database.ts` for the current `TRAILS_ENV`". In a fresh
  `ar new shop` project with `TRAILS_ENV=development` and a migrated DB,
  `import { connect } from "./db.js"; await connect();` raises:

  ```text
  ActiveRecord::AdapterNotSpecified: The `development` database is not configured for the `development` environment.
  ```

- `examples/twitter-clone/src/db.ts:15-19` does the same, so `pnpm smoke`
  (`TRAILS_ENV=test tsx src/smoke.ts`) fails at `connect()` with
  "The `test` database is not configured … Available database configurations are: (none)".

`ar runner` and `ar console` work because they call
`loadDatabaseConfig(cwd)` (`packages/activerecord-cli/src/db-helpers.ts:6`)
first. That is the railtie-style seam that should populate
`Base.configurations`.

`packages/activerecord-cli/README.md` ("Bootstrap") and
`examples/twitter-clone/README.md` ("Connection config") document the dead
fallback too.

## Acceptance criteria

- The generated `db.ts` populates `Base.configurations` from
  `config/database.ts` (through the same seam `ar runner` uses, exported if it
  isn't already) before `establishConnection()`. A fresh `ar new` project's
  `connect()` works.
- `examples/twitter-clone/src/db.ts` is converged the same way, and
  `pnpm smoke` passes.
- The e2e happy-path suite imports the generated `db.ts` and calls `connect()`.
