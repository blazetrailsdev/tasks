---
title: "pg-connection-close-prepared-and-portal"
status: done
updated: 2026-11-23
rfc: "0186-pg-gem-port"
cluster: "connection"
packages:
  - "pg"
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#10664
claim: "2026-11-23T19:32:21Z"
assignee: "pg-coder-dup-and-composite-dimensions"
blocked-by: null
closed-reason: null
---

# pg: port close_prepared / close_portal and their sync/async variants

## Context

RFC 0186 reopened 2026-11-23 for 100% scored `pg` parity. `parity:api` reports six
`PG::Connection` close methods missing (pg 1.6, libpq 17):

- `close_prepared` / `close_portal`: Ruby aliases installed by `REDIRECT_METHODS` (`vendor/pg/v1.6.2/lib/pg/connection.rb:1049-1054`) and `async_api=` (`:1080-1090`)
- `async_close_prepared` / `async_close_portal`: the async variants (`vendor/pg/v1.6.2/ext/pg_connection.c`)
- `sync_close_prepared` / `sync_close_portal`: `pg_connection.c:1593-1621`

node-pg's protocol connection sends a Close message (`close({ type: "S" | "P", name })`)
followed by `sync`. The `prepare` path in `packages/pg/lib/connection.ts:193-211` shows how
to submit a raw protocol exchange through the engine.

## Acceptance criteria

- All six methods return a `PG::Result`, raise as the gem does on a bad name, and follow the async/sync alias layout `describe_prepared` already uses.
- Port `connection_spec.rb`'s "should convert strings to #close_prepared" and "#close_portal" examples.
- `pnpm parity:api --package pg` shows the six matched.
