---
title: "sqlite3-node-sqlite-drop-serializable-database-cast"
status: blocked
updated: 2026-11-23
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: "bumping @types/node 25.3.5->26.6.6 across the 13 packages splits vite's types (packages/turbo/test/application-system-test-case.ts TS2345) and sqlite3 itself declares no @types/node; needs a workspace-wide bump story, or sqlite3-node-sqlite-disable-quirk-mode-keeps-connection-state removes the serialize path"
closed-reason: null
---

## Context

`packages/sqlite3/lib/engine/node-sqlite.ts` declares an `@internal` `SerializableDatabase` interface and casts `DatabaseSync` to it twice in `disableQuirkMode` (trails#10594), because the workspace's `@types/node` (25.3.5) does not declare `DatabaseSync#serialize` / `#deserialize`, which the Node 26.13.0 runtime (`.nvmrc`) provides.

## Acceptance criteria

- [ ] `@types/node` is bumped to a version declaring `serialize` / `deserialize` on `DatabaseSync`.
- [ ] `SerializableDatabase` and both `as unknown as` casts are removed from `node-sqlite.ts`.
