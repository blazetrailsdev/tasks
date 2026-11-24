---
title: "pg-put-copy-data-and-flush-sync-async-pairs"
status: done
updated: 2026-11-24
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10702
claim: "2026-11-24T16:36:49Z"
assignee: "pg-put-copy-data-and-flush-sync-async-pairs"
blocked-by: null
closed-reason: null
---

# pg: port put_copy_data / put_copy_end / flush sync-async pairs

## Context

`REDIRECT_SEND_METHODS` (`vendor/pg/v1.6.2/lib/pg/connection.rb:1007-1027`) maps `put_copy_data`, `put_copy_end` and `flush` to their `async_*` / `sync_*` variants. `async_send_api=` (`:1057-1062`) switches between them. In `packages/pg/lib/connection.ts`, the table has only the `isnonblocking`, `nonblocking?` and `pipeline_sync` rows, because the other pairs are unported. `flush` is a single method that returns `true`.

- `sync_put_copy_data` / `sync_put_copy_end` / `sync_flush`: `vendor/pg/v1.6.2/ext/pg_connection.c:2694`, `:2600` area, `:2325`.
- `async_put_copy_data` / `async_put_copy_end` / `async_flush`: `vendor/pg/v1.6.2/lib/pg/connection.rb`.

## Acceptance criteria

- Port both variants of each pair over node-pg's COPY protocol.
- Add the three rows to `REDIRECT_SEND_METHODS` and drop the CONVERGEABLE receipt at the table.
