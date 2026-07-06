---
title: "Port deprecated raw-connection initialize overload to base adapter"
status: blocked
updated: 2026-05-29
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 200
priority: 13
pr: null
claim: null
assignee: null
blocked-by: "Constructor restructure across PG/MySQL2 adapters; also gates AdapterConnectionTest integration tests"
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

PR #4686 (mysql2-connectbang-populate-base-connection-field) de-risks the MySQL2
half: `_client` is now a typed accessor over the base `_connection` slot (no
parallel field), so a promoted `_unconfiguredConnection` → `_connection` would
be picked up by `_ensureClient()`'s `if (this._client) return this._client`
short-circuit. The remaining MySQL2 work is wiring the promotion into that path
(and dropping the `_isFakeConnection` inert-guard for the deprecated overload —
mysql2-adapter.ts constructor ~L400-415), not a full pool restructure.
