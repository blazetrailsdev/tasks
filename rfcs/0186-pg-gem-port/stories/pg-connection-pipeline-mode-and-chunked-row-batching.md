---
title: "pg-connection-pipeline-mode-and-chunked-row-batching"
status: claimed
updated: 2026-11-23
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-23T23:29:45Z"
assignee: "pg-connection-connect-poll-c-primitives"
blocked-by: null
closed-reason: null
---

# pg: port pipeline mode and chunked-row batching over node-pg

## Context

`sendPipelineSync` / `syncPipelineSync` / `pipelineSync` (`packages/pg/lib/connection.ts`) always raise "cannot send pipeline when not in pipeline mode", because `enter_pipeline_mode`, `exit_pipeline_mode`, `pipeline_status`, `send_flush_request`, `send_query_params` and `get_result` (`vendor/pg/v1.6.2/ext/pg_connection.c`) are unported. `setChunkedRowsMode` validates its argument and timing (`pg_connection.c:1921`) but node-pg delivers a result whole, so rows are not batched into `PGRES_TUPLES_CHUNK` results.

## Acceptance criteria

- Pipeline state on `Connection` (`pipelineStatus`, `enterPipelineMode`, `exitPipelineMode`), with `sendPipelineSync` sending a protocol `Sync` through the engine (`packages/pg/lib/engine/node-pg.ts`) and delivering `PGRES_PIPELINE_SYNC`.
- Chunked mode splits rows into `PGRES_TUPLES_CHUNK` results followed by an empty `PGRES_TUPLES_OK`.
- Port `connection_spec.rb`'s pipeline examples (`:2180-2290`) and the remaining `set_chunked_rows_mode` examples (`:2125-2175`), plus `#inspect`'s "should tell about pipeline mode".
