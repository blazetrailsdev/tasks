---
title: "Port retry loop + raw-connection ownership to PostgreSQLAdapter#reconnectBang"
status: blocked
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 100
pr: null
claim: null
assignee: null
blocked-by: "Two internal design fixes: configureConnection(client) signature mismatch with base argless call; reconnect() calling resetTransaction() clobbers base lifecycle restore"
---

## Context

Thread the base retry loop (connection_retries / retry_deadline / backoff) into
PostgreSQL's `reconnectBang`. Two design fixes gate it: the
`configureConnection(client)` signature mismatch with the base argless call, and
`reconnect()` calling `resetTransaction()` itself (which would clobber the base
lifecycle restore).

## Acceptance criteria

- [ ] `resetTransaction` moved out of PG `reconnect()`; callers audited
- [ ] `configureConnection` signature reconciled with base
- [ ] Base retry loop (retries / deadline / backoff) threaded into PG
      `reconnectBang`

## Notes

From the connection-pool gap plan (PF pg-reconnect). Blocked on the two design
fixes above.
