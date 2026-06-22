---
title: "Relation#explain should collect over exec_queries (always-execute), not cache-aware toArray (MySQL backtick fidelity)"
status: done
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3845
claim: "2026-06-21T23:11:11Z"
assignee: "relation-explain-uses-exec-queries-not-cached-toarray"
blocked-by: null
---

## Context

`Relation#explain` collects the queries to EXPLAIN over the cache-aware
`this.toArray()` (`packages/activerecord/src/relation.ts:2854`), whereas
Rails collects over `exec_queries`, which **always executes** the SELECT
(bypassing the load cache) inside `collecting_queries_for_explain`:

    # vendor/rails/.../relation.rb:332 + relation/explain.rb
    def explain(*options)
      exec_explain(collecting_queries_for_explain { exec_queries }, options)
    end

Because `toArray()` short-circuits when the relation is already loaded
(or `.none()`), trails can collect **zero** queries and then falls back
to explaining `_toSql()` directly (`relation.ts:2880`). `_toSql()` renders
Arel's double-quoted identifiers (`"posts"`), so on MySQL the EXPLAIN runs
against `EXPLAIN ... "posts"` — double quotes that MySQL (non-ANSI) reads
as a string literal — instead of the backtick-quoted SQL the driver
actually executed via `sql.active_record`. Rails never hits this path: it
re-runs `exec_queries`, capturing the real adapter-quoted SQL every time,
and yields empty output for genuinely query-less relations.

The backtick assertions in
`adapters/abstract-mysql-adapter/mysql-explain.test.ts`
("Relation#explain on MySQL captures the SELECT via sql.active_record" /
"captures preload queries") guard the happy path but do not exercise the
already-loaded fallback.

trails already has the always-executing primitive: `execQueries()` /
`execMainQuery()` (`relation.ts:6091`), which mirrors Rails `exec_queries`
(it calls `connection.execute`, emitting `sql.active_record`). `explain`
simply isn't routed through it.

## Acceptance criteria

- [ ] `Relation#explain` collects queries over an always-executing path
      (equivalent to Rails `exec_queries` — e.g. `execQueries()` /
      `execMainQuery()`), not cache-aware `toArray()`, so an already-loaded
      relation re-executes and the captured SQL is the real adapter-quoted
      SQL (backticks on MySQL), never `_toSql()`'s double-quoted form.
- [ ] Remove (or restrict) the `queries.length === 0` → `_toSql()` fallback
      in `execExplain` (`relation.ts:2880`) so EXPLAIN never emits
      Arel-quoted identifiers that diverge from the executed SQL. Decide the
      `.none()` shape to match Rails (Rails yields empty output for a
      query-less relation).
- [ ] Add a regression test: `explain()` on an _already-loaded_ MySQL
      relation still emits backtick-quoted identifiers (and not
      double-quoted), proving the capture path — not the toSql fallback —
      was used.
