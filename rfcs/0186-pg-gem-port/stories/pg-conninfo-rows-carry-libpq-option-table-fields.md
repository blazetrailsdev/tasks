---
title: "pg: conninfo rows carry libpq's envvar/label/dispchar/dispsize"
status: done
updated: 2026-11-25
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 3
pr: trails#10717
claim: "2026-11-24T19:36:54Z"
assignee: "pg-exec-copy-in-returns-copy-in-result"
blocked-by: null
closed-reason: null
---

## Context

`pgconn_make_conninfo_array` (`vendor/pg/v1.6.2/ext/pg_connection.c`, used by `conndefaults`, `conninfo_parse`, `conninfo`) emits keyword, envvar, compiled, val, label, dispchar, dispsize per row. trails#10691 ports keyword/compiled/val only (`packages/pg/lib/connection.ts`, `conndefaults`, `Connection.conninfoParse`, `#conninfo`). The scored spec "can return the default connection options" (`vendor/pg/v1.6.2/spec/pg/connection_spec.rb:1557-1562`) asserts `include(:keyword, :label, :dispchar, :dispsize)`.

## Acceptance criteria

- Rows carry envvar, label, dispchar, dispsize from libpq's `PQconninfoOptions` table (fe-connect.c), keyed by `CONNINFO_KEYWORDS`.
- Port the spec at connection_spec.rb:1557 verbatim.
