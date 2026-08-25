---
title: "PoolConfig must not import DatabaseTasks at module scope"
status: draft
updated: 2026-08-11
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 40
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`dist/tasks/database-tasks.js` contributes **20,199 B** to the minified bundle
of an app that only wrote
`import { Base } from "@blazetrails/activerecord"`, and the whole `tasks/` tree
contributes 34,578 B (1.8%).

It is dragged in by a single module-scope import on the connection-pool path:
`packages/activerecord/src/connection-adapters/pool-config.ts:13`

```ts
import { DatabaseTasks } from "../tasks/database-tasks.js";
```

`pool-config` is reached from `base.js` via
`connection-adapters/abstract/connection-handler.ts`, so every app pays for the
rake-task module.

This is a fidelity gap as well as a size one. Rails' `DatabaseTasks`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb`) is
loaded by the railtie's rake tasks; `ConnectionAdapters::PoolConfig`
(`lib/active_record/connection_adapters/pool_config.rb`) does not reference it.
Check what `pool-config.ts` actually uses `DatabaseTasks` for and where Rails
gets that value from — the odds are it is reaching across a boundary Rails does
not.

## Acceptance criteria

1. `packages/activerecord/src/connection-adapters/pool-config.ts` no longer
   imports `DatabaseTasks` at module scope, and the Rails `file:line` for how
   `PoolConfig` obtains that value instead is cited at the call site.
2. `dist/tasks/**` does not appear in the esbuild metafile for
   `import { Base }`. Target: ≥30 KB off the 1,904,049 B baseline.
3. No behavior change — the AR suite and all adapter lanes stay green, and
   `activerecord-cli` still drives `DatabaseTasks` normally.
