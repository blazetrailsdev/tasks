---
title: "PG::Connection.new is a static async new; PG.connect calls it"
status: draft
updated: 2026-11-17
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PG.connect` is `Connection.new(*args, &block)` (`vendor/pg/*/lib/pg.rb:62-64`). `PG::Connection.new` (`vendor/pg/*/lib/pg/connection.rb:771-782`) connects; `:783-784` alias it as `async_connect` and `connect`. In trails that body is the module function `connect` in `packages/activerecord/lib/pg/connection.ts:506`, seated as `static connect = connect`. `Connection`'s public constructor wraps an already-connected driver client, so there is no `new` and `PG.connect` (`pg/pg.ts`) calls `Connection.connect`.

## Converged shape

Root CLAUDE.md, "Every promise has an owner": an async `initialize` is a `protected constructor` plus `static async new`. Move the connect body into `static async new(...)` on `Connection`. Make the alias `static connect = Connection.new` (and `asyncConnect`). `PG.connect` calls `Connection.new(...)` as `pg.rb:63` does. Update every `new Connection(...)` / `pgConnection(...)` caller.

## Acceptance criteria

- `PG.connect` calls `Connection.new`. `connect` / `asyncConnect` alias it.
- No public `new Connection(...)` remains. PG lane green.
