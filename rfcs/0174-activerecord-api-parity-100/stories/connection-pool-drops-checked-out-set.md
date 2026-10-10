---
title: "activerecord: ConnectionPool drops its trails-only _checkedOut set"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left open by trails#8482.

Rails' `ConnectionPool` tracks a checked-out connection through the connection itself: `lease` / `expire`
set and clear its owner, and `in_use?` reads it
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:582-640,753-800`).

trails' pool also keeps a `_checkedOut` set
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:251`), written in `checkin`,
`remove`, `disconnect`, `discardBang`, `acquireConnectionSync`, `tryToCheckoutNewConnection` and the
checkout path, and read once, in `attemptToCheckoutAllExistingConnections`
(`if (!this._checkedOut.has(conn))`). Rails' body at `:753-800` has no such read. Each write is a call
Rails' method does not make.

## Acceptance criteria

- [ ] `attemptToCheckoutAllExistingConnections` decides as `connection_pool.rb:753-800` does, without
      `_checkedOut`.
- [ ] `_checkedOut` and every write to it are deleted.
- [ ] The pool suites pass on every adapter lane.
