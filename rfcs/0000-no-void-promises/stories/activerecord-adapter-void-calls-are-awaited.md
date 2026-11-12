---
title: "ActiveRecord connection adapters stop dropping promises"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: discarded-calls
packages: [activerecord]
deps: [no-floating-promises-repo-wide-ignore-void-false, no-swallowed-rejection-lint-rule]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 3. `connection-adapters/statement-pool.ts:47,55,67`
(`void this.dealloc`, async on PostgreSQL, `postgresql-adapter.ts:2035`),
`connection-adapters/abstract/connection-pool.ts:737,786,802`,
`connection-adapters/mysql2-adapter.ts:186`,
`connection-adapters/postgresql/quoting.ts:176`,
`connection-adapters/schema-cache.ts:195`,
`connection-adapters/sqlite3-adapter.ts:1263`, `pg/connection.ts:255`,
`tasks/database-tasks.ts:775`.

## Acceptance criteria

- [ ] Each site awaits, returns, or `Promise.allSettled`s its promise; methods become async up to the first already-async caller.
- [ ] A failing `dealloc` on PostgreSQL propagates (a regression test that fails on the baseline).
- [ ] activerecord's marks drop by this story's count.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
