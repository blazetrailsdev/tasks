---
title: "converge-adapter-driver-handle-members"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`receipt-moved-adapter-classes-and-pool` receipted the driver-handle members of the three
concrete adapters as `@noRailsEquivalent CONVERGEABLE converge-adapter-driver-handle-members`.

| TS file                                     | Names                    |
| ------------------------------------------- | ------------------------ |
| `connection-adapters/mysql2-adapter.ts`     | `close`, `raw`           |
| `connection-adapters/postgresql-adapter.ts` | `close`, `raw`           |
| `connection-adapters/sqlite3-adapter.ts`    | `close`, `raw`, `isOpen` |

Rails exposes the driver through `raw_connection` (`abstract_adapter.rb:798`), tears it
down through `disconnect!` (`abstract_adapter.rb:700`, `mysql2_adapter.rb:123`,
`postgresql_adapter.rb:386`, `sqlite3_adapter.rb:221`) and answers liveness through
`active?` (`abstract_adapter.rb:656`, `sqlite3_adapter.rb:210`). `close` / `raw` / `open?`
only match by short name elsewhere in Rails (`abstract_adapter.rb:830` `close` returns the
connection to its pool).

## Acceptance criteria

- Callers of `raw` move to `rawConnection`, callers of `isOpen` to `isActive`, and the
  adapter `close` either becomes Rails' pool-returning `close` (`abstract_adapter.rb:830`)
  or its callers use `disconnectBang`.
- Every receipt citing this story is gone and activerecord's `total` is tightened.
