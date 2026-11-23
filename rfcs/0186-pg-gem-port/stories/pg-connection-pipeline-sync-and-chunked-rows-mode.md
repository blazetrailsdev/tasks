---
title: "pg-connection-pipeline-sync-and-chunked-rows-mode"
status: claimed
updated: 2026-11-23
rfc: "0186-pg-gem-port"
cluster: "connection"
packages:
  - "pg"
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: "2026-11-23T21:50:04Z"
assignee: "pg-connection-pipeline-sync-and-chunked-rows-mode"
blocked-by: null
closed-reason: null
---

# pg: port pipeline_sync variants and set_chunked_rows_mode

## Context

RFC 0186 reopened 2026-11-23 for 100% scored `pg` parity. `parity:api` reports these
`PG::Connection` pipeline and row-mode methods missing:

- `pipeline_sync`'s Ruby body (`vendor/pg/v1.6.2/lib/pg/connection.rb:551-555`, `send_pipeline_sync` then `flush`) and its `async_pipeline_sync` alias
- `sync_pipeline_sync` and `send_pipeline_sync` (C, `vendor/pg/v1.6.2/ext/pg_connection.c`), selected through `REDIRECT_SEND_METHODS` (`connection.rb:1006-1027`)
- `set_chunked_rows_mode` (`pg_connection.c:1897`), next to `set_single_row_mode`

node-pg has no libpq pipeline mode. Its protocol connection can send `Sync` and `Flush`
directly, and the engine (`packages/pg/lib/engine`) is where to build them. Chunked mode
needs row batching on the result stream.

## Acceptance criteria

- `sendPipelineSync`, `syncPipelineSync`, `pipelineSync` / `asyncPipelineSync` and `setChunkedRowsMode` ported, raising `PG::Error` outside pipeline mode or at the wrong time, as the spec's "raises an error when not in pipeline mode" and "raises an error when called at the wrong time" examples expect.
- Port the `connection_spec.rb` `pipeline_sync`, `send_pipeline_sync` and `set_chunked_rows_mode` examples that the engine can run.
- `pnpm parity:api --package pg` shows the four methods matched.
- If one of them cannot run over node-pg, keep the method, note the limit in the PR, and file a follow-up story here. Do not add a skip.
