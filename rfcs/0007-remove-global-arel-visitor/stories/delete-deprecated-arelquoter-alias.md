---
title: "Delete the deprecated ArelQuoter type alias — Rails names only the connection"
status: in-progress
updated: 2026-07-23
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 5118
claim: "2026-07-23T02:25:41Z"
assignee: "delete-deprecated-arelquoter-alias"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during #5067 (delete-arel-default-quoters-and-constructor-defaults).

`packages/arel/src/visitors/to-sql.ts:34` still exports
`export type ArelQuoter = ArelConnection;` marked
`@deprecated Use ArelConnection`, re-exported from
`packages/arel/src/visitors/index.ts:1`. Rails has no such name — the
connection parameter of `ToSql#initialize` (`to_sql.rb:12`) is just the
adapter connection, which trails names `ArelConnection`
(`packages/arel/src/visitors/connection.ts`). With the default quoters now
deleted from the production surface (#5067), the alias is the last vestige of
the pre-RFC-0007 "quoter" framing.

Known users: `packages/arel/src/visitors/to-sql.test.ts:2290`
(`const stubQuoter: Visitors.ArelQuoter = {...}`) and the describe name at
:2267 references it in prose. Sweep any other importers repo-wide.

## Acceptance criteria

- `ArelQuoter` no longer exists (to-sql.ts, visitors/index.ts, all importers
  switched to `ArelConnection`).
- Do NOT rename tests — the describe at to-sql.test.ts:2267 keeps its name;
  only type annotations change.
- api:compare / test:compare delta non-negative.
