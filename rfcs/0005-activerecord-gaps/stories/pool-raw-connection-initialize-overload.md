---
title: "Port deprecated raw-connection initialize overload to base adapter"
status: ready
updated: 2026-07-07
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 200
priority: 13
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Port `abstract_adapter.rb:141`'s deprecated `initialize` overload that stashes a
pre-opened connection in `@unconfigured_connection`, making `verifyBang`'s
fast-path production-usable. Requires a constructor restructure across the PG and
MySQL2 adapters.

## Acceptance criteria

- [ ] Base adapter supports the deprecated raw-connection `initialize` overload
      (`@unconfigured_connection` stash)
- [ ] PG / MySQL2 constructors restructured to support it
- [ ] `verifyBang` fast-path usable in production
- [ ] `AdapterConnectionTest` integration tests that depend on it unblocked

## Notes

From the connection-pool gap plan (PF raw-connection-initialize). Likely splits;
related to [[pool-pg-reconnect-loop]].
