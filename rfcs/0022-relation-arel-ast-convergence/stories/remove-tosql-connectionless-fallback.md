---
title: "Remove Relation#toSql connectionless fallback (resolve a connection like model.with_connection)"
status: done
updated: 2026-06-15
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: ["relation-tosql-unprepared-statement"]
deps-rfc: []
est-loc: 80
priority: null
pr: 3386
claim: "2026-06-15T17:54:26Z"
assignee: "remove-tosql-connectionless-fallback"
blocked-by: null
---

## Context

`Relation#toSql` (`packages/activerecord/src/relation.ts`,
`_toSqlViaConnection`) carries a connectionless fallback: when
`_resolveAdapter()` returns `null` (HABTM join models with no established
connection), it renders the node through a default ANSI `Visitors.ToSql` +
`SubstituteBinds(defaultQuoter, …)` instead of the connection.

Rails has no such branch. `Relation#to_sql` (`relation.rb:1217-1218`) is
`model.with_connection { |conn| conn.unprepared_statement { conn.to_sql(arel) } }`
— `with_connection` always yields a real connection, so there is exactly one
render path (the connection's visitor + collector), never a quoter stand-in.

The fallback predates the unprepared-statement port (it was the old
`adapter ? adapter.quote(val) : hand-rolled` branch); the
`relation-tosql-unprepared-statement` story (PR #3330) only swapped the
hand-rolled quoter for the shared `defaultQuoter`. It remains a trails-ism.

## Acceptance criteria

- `Relation#toSql` resolves a connection the way Rails' `model.with_connection`
  does, so the `_resolveAdapter() === null` branch (and the default-ANSI /
  `defaultQuoter` fallback) in `_toSqlViaConnection` is deleted — one render
  path through the connection, matching `relation.rb:1217-1218`.
- Audit why `_resolveAdapter()` returns `null` for HABTM join models and
  converge that to a real connection (mirroring `with_connection`), rather than
  papering over it at the `toSql` call site. If a genuinely connectionless
  `toSql` is still reachable, document the exact reproduction and converge the
  connection resolution, not the renderer.
- No behavior change in existing snapshot output; api:compare and test:compare
  deltas non-negative.

Depends on: relation-tosql-unprepared-statement.
