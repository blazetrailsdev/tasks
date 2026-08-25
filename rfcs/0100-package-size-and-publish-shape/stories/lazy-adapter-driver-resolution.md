---
title: "Lazy adapter driver resolution, matching Rails' connect-time require"
status: draft
updated: 2026-08-11
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`import { Base } from "@blazetrails/activerecord"` statically reaches **every**
database driver. Bundling that one-line entry with
`esbuild --bundle --format=esm --platform=node` **fails outright**:

```text
✘ Could not resolve "pg"           connection-adapters/postgresql-adapter.js:1
✘ Could not resolve "mysql2/promise"  connection-adapters/mysql2-adapter.js:1
✘ Could not resolve "better-sqlite3"  sqlite/better-sqlite3.js:1
```

Those five drivers are correctly declared **optional** peers
(`packages/activerecord/package.json:70-93`), so the common case — a SQLite-only
app, or any app that installed one driver — hits a hard build error. Marking
them all external is the only workaround, and even then the adapter code itself
stays in the bundle: **420,676 B (22.1%)** of the 1,904,049 B minified output is
`connection-adapters/**`, of which **~205 KB is adapters the app will never
use** (PostgreSQL tree 129,160 B, MySQL tree 70,438 B, libsql+expo+node-sqlite
8,388 B).

Cause: `packages/activerecord/src/connection-adapters.ts:126-165` builds all
eight loaders and calls `register()` on them at module scope. Each loader is
`import("./connection-adapters/<x>-adapter.js")` with a **static string
literal**, which every bundler follows into the graph. The path from the
entrypoint is not optional:
`base.js` → `src/connection-adapters/abstract/connection-handler.ts:28`
(`import ... from "../../connection-adapters.js"`) → all eight loaders →
`postgresql-adapter.ts:1` (`import pg from "pg"`),
`mysql2-adapter.ts:1` (`import mysql from "mysql2/promise"`),
`sqlite/better-sqlite3.ts:1` (`import Database from "better-sqlite3"`).

**This is also a fidelity gap.** Rails resolves an adapter by `require`-ing it
inside `resolve` at connect time
(`vendor/rails/activerecord/lib/active_record/connection_adapters.rb`), so an
app that never names `postgresql` never loads `pg`. The trails port kept the
registry's shape but made the edge static.

The per-adapter subpath exports already exist (`package.json:8-68`) and are the
natural opt-in surface.

## Acceptance criteria

1. `esbuild --bundle --format=esm --minify --platform=node` over
   `import { Base } from "@blazetrails/activerecord"` **succeeds with no
   `--external` flags** and none of the five optional drivers installed.
2. The resulting bundle contains no `postgresql-adapter`, `mysql2-adapter`,
   `libsql-*`, `expo-sqlite-adapter` or `node-sqlite-adapter` module (verify via
   `--metafile`). Target: ≥150 KB smaller than the 1,904,049 B baseline.
3. Runtime behavior is unchanged for every adapter: naming `postgresql` in a
   database config still resolves and connects. All adapter-lane CI stays green.
4. The registry stays recognizable as
   `active_record/connection_adapters.rb` — same registered names, same
   `resolve`/`resolveSync` shape, same `AdapterNotFound` message. Do not invent
   a new registration abstraction; cite the Rails `file:line` for the shape you
   land on.
5. Record the before/after bundle bytes and module count in the PR body.
