---
title: "adapter-configure-connection-failure-propagation"
status: claimed
updated: 2026-06-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-30T21:24:46Z"
assignee: "adapter-configure-connection-failure-propagation"
blocked-by: null
---

## Context

Surfaced by `converge-adapter-connection-test-one-schema` (RFC 0048) while
porting Rails' `AdapterConnectionTest` case "disconnect and recover on
configure_connection failure" (`vendor/rails/activerecord/test/cases/adapter_test.rb:852`).

Rails: a freshly built `connection_pool.new_connection` whose
`configure_connection` raises `ConnectionFailed` twice makes the first query
raise the original `ConnectionFailed` (after the reconnect retry loop is
exhausted); once the failures drain, the next query reconfigures cleanly and
succeeds.

trails diverges: when `configureConnection` raises during a (re)connect,
`attemptConfigureConnection` (`abstract-adapter.ts:2369`) disconnects the raw
handle and the abstract reconnect/verify lifecycle does not re-surface the
original `ConnectionFailed`. On the eager-connect SQLite path the subsequent
`SELECT 1` then runs against the now-closed driver handle and throws
`StatementInvalid: The database connection is not open`
(cause `TypeError: The database connection is not open`) instead of
`ConnectionFailed`.

The faithful port test is checked in but `it.skip`ped in
`packages/activerecord/src/adapter.test.ts` (`AdapterConnectionTest` case
"disconnect and recover on configure_connection failure") with a pointer to
this story.

## Acceptance criteria

- [ ] When `configure_connection` raises during a connect/reconnect, the
      abstract lifecycle re-raises the original `ConnectionFailed` (not a
      generic `StatementInvalid` about a closed handle), across
      SQLite/PG/MySQL — mirroring Rails' `reconnect!`/`with_raw_connection`
      re-raise of the translated exception.
- [ ] Un-skip the `AdapterConnectionTest` case "disconnect and recover on
      configure_connection failure" in `adapter.test.ts`; it passes verbatim
      (assert `ConnectionFailed`, then recovery succeeds, `failures` drained).
- [ ] No regression in the other AdapterConnectionTest cases.
