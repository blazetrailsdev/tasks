---
title: "pg-copy-out-get-copy-data-and-discard-arm"
status: in-progress
updated: 2026-11-25
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: trails#10756
claim: "2026-11-25T17:02:05Z"
assignee: "pg-copy-out-get-copy-data-and-discard-arm"
blocked-by: null
closed-reason: null
---

# pg: COPY TO STDOUT through exec, get_copy_data, and discard_results' COPY_OUT arm

## Context

`pgconn_discard_results` (`vendor/pg/v1.6.2/ext/pg_connection.c:3357-3374`) drains a pending `PGRES_COPY_OUT` with `PQgetCopyData` before it continues. trails#10717 ported `discardResults` (`packages/pg/lib/connection.ts`) with only the COPY_IN arm. trails has no `getCopyData`, and the `dispatch` submittable in `packages/pg/lib/engine/node-pg.ts` has no `handleCopyOutResponse` / `handleCopyData`, so `exec("COPY ... TO STDOUT")` cannot reach `PGRES_COPY_OUT` at all. `copy_data`'s COPY OUT specs (`spec/pg/connection_spec.rb`, "#copy_data" "can process #copy_data output queries in text format") depend on the same machinery.

## Acceptance criteria

- `dispatch` delivers `PGRES_COPY_OUT` and buffers CopyData. `getCopyData` / `syncGetCopyData` are ported from pg_connection.c.
- `discardResults` gains the COPY_OUT arm, line for line.
- A test shows that an `exec` after an unread COPY OUT runs the next query.
