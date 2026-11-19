---
title: "LibSQLRemoteAdapter runs on the native libsql addon, so it cannot run in a Cloudflare Worker"
status: draft
updated: 2026-11-19
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/lib/sqlite/libsql.ts:1` imports `Database from "libsql"`, a native N-API addon, and
`libsqlRemoteDriver` (`:289-296`) opens remote URLs through it (`openRemoteDatabase`, `:267-278`). A
Cloudflare Worker loads no native module, so `libsql-remote` is not Worker-capable, although Turso's
fetch-based `@libsql/client/web` is. Found while building `examples/cloudflare-worker` (RFC 0247), which
ships on PostgreSQL through Hyperdrive only for this reason.

## Acceptance criteria

- [ ] `libsql-remote` reaches a remote libSQL server over fetch (no native addon on its import graph), so an
      esbuild bundle for workerd contains no `.node` file.
- [ ] `examples/cloudflare-worker` gains the libSQL arm: `config/database.ts` / the Worker entry select it
      from one setting, and `infra/` provisions a Turso database (or takes an existing URL and token).
