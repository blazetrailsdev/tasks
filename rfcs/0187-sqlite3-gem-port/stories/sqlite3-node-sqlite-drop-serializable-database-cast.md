---
title: "sqlite3-node-sqlite-drop-serializable-database-cast"
status: draft
updated: 2026-11-22
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
blocked-by: null
closed-reason: null
---

## Context

`packages/sqlite3/lib/engine/node-sqlite.ts` declares an `@internal` `SerializableDatabase` interface and casts `DatabaseSync` to it twice in `disableQuirkMode` (trails#10594), because the workspace's `@types/node` (25.3.5) does not declare `DatabaseSync#serialize` / `#deserialize`, which the Node 26.13.0 runtime (`.nvmrc`) provides.

## Acceptance criteria

- [ ] `@types/node` is bumped to a version declaring `serialize` / `deserialize` on `DatabaseSync`.
- [ ] `SerializableDatabase` and both `as unknown as` casts are removed from `node-sqlite.ts`.
