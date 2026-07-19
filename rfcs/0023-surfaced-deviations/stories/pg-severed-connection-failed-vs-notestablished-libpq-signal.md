---
title: "PG: node-pg cannot reproduce Rails' libpq newline split (pg_terminate → ConnectionFailed)"
status: claimed
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-19T01:01:11Z"
assignee: "pg-severed-connection-failed-vs-notestablished-libpq-signal"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #4935 (adapter-connection-failure-error-classification). Rails'
`translate_exception` (postgresql_adapter.rb:801-818) splits a libpq
`PG::ConnectionBad`: a message ending in `"\n"` → `ConnectionFailed` ("the
server may have already executed part or all of the query"), the pre-send
pg-internal `ConnectionBad` and `"connection is closed"` /
`"no connection to the server"` → `ConnectionNotEstablished` (the query never
ran). node-pg is pure JS with no libpq layer: both a live-socket mid-send sever
AND `pg_terminate_backend`'s forced pre-send bad state surface the byte-identical
`"Client has encountered a connection error and is not queryable"` (verified: no
`code`, no distinguishing property). #4935 therefore maps that ambiguous message
to `ConnectionFailed`, and the ported Rails test
`translate no connection exception to not established`
(adapters/postgresql/postgresql-adapter.test.ts) had to assert `ConnectionFailed`
instead of Rails' `ConnectionNotEstablished` — so its name no longer matches its
assertion (Rails only reaches `ConnectionNotEstablished` there via an explicit
`send_query` pre-send trick flipping libpq `PG::Connection#status` to
`CONNECTION_BAD`, which node-pg has no analogue for).

## Acceptance criteria

- [ ] Either find a node-pg signal that distinguishes a pre-send `CONNECTION_BAD`
      from a live-socket sever and restore `ConnectionNotEstablished` for the
      `pg_terminate_backend` case so the test matches Rails verbatim, OR document
      why it is intractable on node-pg and keep the deviation.
- [ ] Reconcile the `translate no connection exception to not established` test's
      name/assertion (or the assertion) once the above is decided.
