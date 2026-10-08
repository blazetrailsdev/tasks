---
title: "activerecord: loadAsync schedules without the schema load and the deferred distinct-PK drain"
status: draft
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Replaces `load-async-bypasses-exec-queries-prerequisites`, closed as FALSIFIED
in the 2026-10-08 blocked-story triage. That story waited for two prerequisites
to leave the query path; one of them,
`_materializeDeferredDistinctPkPredicates`, is ratified there by trails
CLAUDE.md § "`Relation` is evaluated by an async query". The hazard it
described is a bug in its own right and is refiled here. It has not been
reproduced.

`Relation#execQueries` runs `ensureSchemaLoaded` and
`_materializeDeferredDistinctPkPredicates` only on the foreground pass
(`packages/activerecord/src/relation.ts`, near `:1066` as of 2026-08).
`loadAsync` (`relation.ts:467`) goes to `execMainQuery(true)` without them.
`execMainQuery` is deliberately not `async`, so that a scheduled relation keeps
its `FutureResult` and `cancel`; awaiting the prerequisites first would force
every scheduled relation into the promise arm. Rails has neither prerequisite:
`load_async` is
`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:1138`, and
`exec_main_query(async: true)` runs against a schema that loads in line.

## Acceptance criteria

- A failing test first: `loadAsync` on a relation with an unloaded schema, and
  on one carrying a deferred distinct-PK predicate, showing the wrong result or
  SQL.
- `loadAsync` runs both prerequisites before scheduling, and a scheduled
  relation still supports `cancel`.
- If no shape keeps `cancel`, the story is blocked with that measurement and
  not closed.
