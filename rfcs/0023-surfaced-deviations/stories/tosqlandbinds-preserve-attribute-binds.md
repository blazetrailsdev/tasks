---
title: "toSqlAndBinds: keep Attribute objects in binds until type_casted_binds"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails keeps `ActiveModel::Attribute` objects in `binds` all the way to the
adapter's `type_casted_binds` (abstract/quoting.rb:224); the
`sql.active_record` payload's `binds` slot therefore carries Attributes.
trails' `toSqlAndBinds`
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`
~line 288) instead unwraps every `ModelAttribute` bind to `valueForDatabase` at
compile time, so drivers and instrumentation payloads receive primitives.
Consequences (surfaced on PR #5094): column type metadata is lost before the
driver (SQLite's `FloatType → SQLITE_FLOAT` dispatch in `_driverBind`,
sqlite3-adapter.ts ~151, only fires on the StatementCache path, which bypasses
toSqlAndBinds and does deliver Attributes); payload `binds` shape diverges from
Rails. Blocker: query-cache keying is `JSON.stringify([sql, binds])`
(abstract/query-cache.ts ~line 674) — Attributes in binds would change every
cached-read key, so convergence must rework cache keying (e.g. key on
`valueForDatabase` like Rails' `binds.map(&:value_for_database)`).

## Acceptance criteria

- [ ] `toSqlAndBinds` no longer unwraps ModelAttribute binds; adapters receive
      Attributes and unwrap in their `type_casted_binds` producers (already
      duck-typed in `_driverBind`/`mysqlBinds`/`typeCastedBinds`).
- [ ] Query-cache keys derive from `valueForDatabase`, not the Attribute object.
- [ ] SQLite whole-valued float binds as SQLITE_FLOAT on the write path.
- [ ] test:compare / api:compare delta non-negative.
