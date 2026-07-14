---
title: "DDL via executeMutation should dirty the query cache (Rails execute-based DDL clears)"
status: claimed
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-14T01:12:36Z"
assignee: "ddl-execute-mutation-dirties-query-cache"
blocked-by: null
closed-reason: null
---

## Context

Rails wires `dirties_query_cache` on the public `execute` (query_cache.rb:13),
and DDL runs through `execute`, so schema changes clear the query cache. trails
routes DDL through `executeMutation` (schema-statements.ts), which PR #4852
deliberately left UNWRAPPED — because CRUD writes funnel
`execInsert/execUpdate/execDelete → executeMutation`, and wiring `executeMutation`
would double-clear each logical write (breaking the `times: 1` expiry tests).

Net effect: after a DDL statement inside an active `cache` block, trails' query
cache is NOT cleared, whereas Rails' is. This is a Rails deviation. It is
currently untested/unobserved (the `cache gets cleared after migration` test runs
with the cache disabled, so it passes regardless), and migrations normally run
outside request cycles, so impact is low — but it is a genuine divergence worth
tracking.

## Acceptance criteria

- [ ] Make trails DDL dirty the query cache the way Rails' `execute`-based DDL
      does, WITHOUT double-clearing normal CRUD writes (which funnel through
      `executeMutation` below the wired `execInsert`/`execUpdate`/`execDelete`).
- [ ] Add a test that a DDL statement inside an enabled `cache` block clears the
      query cache (mirror a Rails query_cache DDL-clears assertion if one exists).
