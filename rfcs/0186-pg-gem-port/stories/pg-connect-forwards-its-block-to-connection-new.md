---
title: "pg: PG.connect forwards its block to Connection.new"
status: done
updated: 2026-11-20
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10443
claim: "2026-11-20T20:45:34Z"
assignee: "pg-connect-forwards-its-block-to-connection-new"
blocked-by: null
closed-reason: null
---

## Context

The gem's `PG.connect(*args, &block)` is `Connection.new(*args, &block)` (`vendor/pg/v1.5.9/lib/pg.rb:62-64`). The block form yields the connection and finishes it afterwards. trails' `PG.connect = (connParams = {}) => PG.Connection.connect(connParams)` (`packages/pg/lib/pg.ts:34`) drops the block without a word, so `PG.connect(params, (conn) => …)` resolves to a connection that never runs the block and never finishes. trails#10398's server test ran into this. `Connection.new` already handles the block (`packages/pg/lib/connection.ts`, the `static async new` overloads).

## Acceptance criteria

- `PG.connect(connParams, block)` forwards the block to `Connection.new`, with the same overloads, so the block form returns the block's value and finishes the connection.
- A `packages/pg` test covers the block form of `PG.connect`.
