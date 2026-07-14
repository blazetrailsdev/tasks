---
title: "Correct the Rails citation for MySQL's bindless cached payload in query-cache.trails.test.ts"
status: draft
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Merged in PR #4866. `packages/activerecord/src/query-cache.trails.test.ts` (test
"stores type_casted_binds lazily") carries a comment explaining why a MariaDB
`Task.find(1)` produces a cached `sql.active_record` payload with EMPTY
`type_casted_binds`, where SQLite/PG produce `[1]`:

> Rails' to_sql_and_binds (database_statements.rb:32-42) leaves binds empty when
> prepared_statements is off, which is the MySQL default, so the slot is `[]`
> there and `[1]` on SQLite/PG.

The conclusion is right and the assertion built on it is correct, but the cited
MECHANISM is the wrong one for this path, and misleadingly so:

1. trails does NOT implement Rails' `to_sql_and_binds` non-prepared else branch
   at all — that is the open divergence tracked by the sibling story
   `unprepared-statements-inline-binds`, which states trails' compile paths
   "always call `visitor.compileWithBinds(...)` and send real binds regardless of
   `preparedStatements`". So a reader verifying this comment against trails finds
   the cited mechanism absent and reasonably concludes the comment is wrong.
2. The actual reason MariaDB yields no binds is `cacheableQuery`
   (`connection-adapters/abstract/database-statements.ts:328`), which DOES branch
   on `host.preparedStatements` — faithfully mirroring Rails' `cacheable_query`
   (`abstract/database_statements.rb:56-66`). The unprepared path compiles through
   `partialQueryCollector` / `partialQuery`, which inlines the values, so
   `find(1)` reaches `selectAll` as a plain SQL STRING; `toSqlAndBinds`'s string
   branch then returns `binds` unchanged (`[]`).

Both mechanisms are gated on the same `prepared_statements` flag and both yield
"no binds when unprepared", which is why the comment's substance holds and CI is
green — only the citation points at a sibling method trails hasn't ported.

## Acceptance criteria

- [ ] The comment in `query-cache.trails.test.ts` ("stores type_casted_binds
      lazily") cites `cacheable_query` (`database_statements.rb:56-66`) +
      PartialQuery inlining as the reason a non-prepared adapter carries no
      binds, instead of `to_sql_and_binds` (`database_statements.rb:32-42`).
- [ ] The comment no longer implies trails implements the `to_sql_and_binds`
      else branch (it does not — see `unprepared-statements-inline-binds`).
- [ ] No assertion changes: `toHaveLength((cached[0].binds ?? []).length)` is
      already correct and adapter-independent.
