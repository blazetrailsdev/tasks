---
title: "P13 — implement StandaloneConnection class"
status: blocked
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 40
pr: null
claim: null
assignee: null
blocked-by: "Rails source refresh — StandaloneConnection absent from the vendored snapshot"
---

## Context

`StandaloneConnection` wraps a raw connection with `throwAway!` / `close`
semantics. The class is absent from the current vendored Rails snapshot, so the
port is blocked until a Rails source refresh.

## Acceptance criteria

- [ ] `connection-adapters/standalone-connection.ts` created with
      `throwAway!` / `close` semantics matching refreshed Rails source
- [ ] 4 skipped tests unskipped and green

## Notes

From the connection-pool gap plan (P13). Blocked on Rails vendor refresh.
