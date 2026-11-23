---
title: "pg: sync close variants and PG17 gate for close_prepared/close_portal"
status: draft
updated: 2026-11-23
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# pg: gate close*prepared/close_portal on libpq 17 and give sync*\* its own body

## Context

trails#10664 ported `close_prepared` / `close_portal`. Two shapes differ from the gem:

- `packages/pg/lib/connection.ts` assigns `syncClosePrepared` / `syncClosePortal` to the async methods. In the gem they are separate C functions (`vendor/pg/v1.6.2/ext/pg_connection.c:1593-1621`, through `pgconn_sync_describe_close_prepared_portal` at `:1548`), and `async_api=` switches the aliases between them (`vendor/pg/v1.6.2/lib/pg/connection.rb:1080-1090`).
- The aliases are installed unconditionally. The gem adds them to `REDIRECT_METHODS` only `if PG::Connection.instance_methods.include? :async_close_prepared` (`connection.rb:1049-1054`), which needs libpq 17 (`HAVE_PQSETCHUNKEDROWSMODE`).

## Acceptance criteria

- The sync variants follow the gem's sync/async layout, once trails has a `REDIRECT_METHODS` / `async_api=` port; until then they are the same engine call at their gem names.
- Calling close on a server older than PG 17 raises as the gem does where the method is undefined.
