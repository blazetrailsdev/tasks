---
title: "pg-exec-copy-in-returns-copy-in-result"
status: done
updated: 2026-11-25
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: trails#10717
claim: "2026-11-24T19:36:54Z"
assignee: "pg-exec-copy-in-returns-copy-in-result"
blocked-by: null
closed-reason: null
---

# pg: exec of COPY FROM STDIN returns a PGRES_COPY_IN result

## Context

`PG::Connection#async_exec` (`vendor/pg/v1.6.2/lib/pg/connection.rb`) is `send_query` + `get_last_result`, so `exec("COPY t FROM STDIN")` returns a `PGRES_COPY_IN` result and the caller then calls `put_copy_data`. trails' `asyncExec` (`packages/pg/lib/connection.ts`) goes through `engine.execute` → node-pg's `Query`. Its `handleCopyInResponse` sends `CopyFail('No source stream defined')`. trails#10702 taught the `dispatch` submittable to deliver `PGRES_COPY_IN`. Because `exec` does not take that path, its spec port "#get_result should send remaining data before waiting" (`vendor/pg/v1.6.2/spec/pg/connection_spec.rb:1303-1315`) uses `sendQuery` + `getLastResult` where the spec uses `exec`.

## Acceptance criteria

- `await conn.exec("COPY t FROM STDIN")` resolves to a `PGRES_COPY_IN` result, and `putCopyData` / `putCopyEnd` then complete the copy.
- The spec port above calls `exec` as Rails does.
