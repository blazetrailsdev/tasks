---
title: "Flake: leading-colon insert_all then where().first() returns null on SQLite and MariaDB"
status: draft
updated: 2026-08-26
rfc: "0061-ci-failures"
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

`packages/activerecord/src/relation/leading-colon-string-writes.trails.test.ts`

> `leading-colon string writes` > `create and insert_all store a leading colon
verbatim` fails intermittently with:

```
TypeError: Cannot read properties of null (reading 'title')
 ❯ packages/activerecord/src/relation/leading-colon-string-writes.trails.test.ts:56:24
```

Line 56 is `expect(inserted!.title).toBe(stored)`, where `inserted` came from
`Topic.where({ author_name: "colon" }).first()` immediately after
`Topic.insertAll([{ title: sent, author_name: "colon" }])` — so the row the
same iteration just inserted is not found.

Observed twice inside ~10 minutes on 2026-08-26, on two different adapters, and
passing on a bare re-run with no code change in between:

- `main` @ `691f6a0c0` — Active Record SQLite Tests
  (run 32994132442, job 98259051012)
- PR #7087 @ `9d848b427` — Active Record MariaDB Tests (1)
  (run 32994385087, job 98259760428) — **passed on re-run of the same commit**

The file was added by #7085 (`214ecf4eb`, `ImmutableString#serialize` leaves a
leading colon on a String). The body loops four `[sent, stored]` cases, and each
iteration does insertAll → `where(...).first()` → `deleteAll()`, so the same
SELECT text repeats across iterations with rows appearing and disappearing
underneath it. That shape is the thing to look at first: either the read is
being served a stale/empty cached result, or the `deleteAll` of iteration N is
racing the `insertAll` of iteration N+1.

Ruled out as the cause: PR #7087's re-wiring of `dirties_query_cache` onto the
public `insert`/`create`/`update`/`delete` (`query_cache.rb:13-15`). The failure
predates that PR's merge on `main`, and all three write paths this test uses
(`_createRecord` -> `connection.insert` at `persistence.ts:281`, `updateAll` ->
`c.update` at `relation.ts:1380`, `deleteAll` -> `c.delete` at
`relation.ts:1459`) already routed through the public methods before it.

Ruled out as the cause: a missing `dirties_query_cache` wiring. Rails wires
twelve methods (`abstract/query_cache.rb:12-16`: `exec_query`, `execute`,
`create`, `insert`, `update`, `delete`, `truncate`, `truncate_tables`,
`rollback_to_savepoint`, `rollback_db_transaction`, `restart_db_transaction`,
`exec_insert_all`) and trails wires all twelve — just split across two sites, so
a grep of the adapter files alone finds only three of them:

- `abstract-adapter.ts:2863-2874` — `execQuery`, `create`, `insert`, `update`,
  `delete`, `execInsertAll`, `truncate`, `truncateTables`, `restartDbTransaction`.
  They live on `AbstractAdapter` because no concrete adapter overrides them
  (see the sqlite3/postgresql/mysql2 comments at `sqlite3-adapter.ts:3009`,
  `postgresql-adapter.ts:4522`, `mysql2-adapter.ts:1818`).
- `sqlite3-adapter.ts:3016-3017` (and the PG/MySQL twins) — `execute`,
  `rollbackDbTransaction`, `rollbackToSavepoint`, the three each adapter
  overrides, wired per-adapter so the override is the wrapped method.

`insertAll` bottoms out in `connection.execInsertAll` (`insert-all.ts:231`),
which IS in the AbstractAdapter list, so the write does dirty the cache.

Independently, the query cache is not even enabled in the AR test lanes: it is
turned on only by `QueryCache.run` (`query-cache.ts:73-82`) via the executor
hooks, and those are installed only by the trailtie (`trailtie.ts:243`), which
the AR suite does not boot. A stale cached read cannot be the mechanism.

Seen a third time on `main` @ `a0a368888` (run 33015202121, job 98331573514,
Active Record SQLite Tests). On that commit the SQLite `:memory:`, PostgreSQL
(1,2) and MariaDB (1,2) lanes were all green, the file passes locally on
repeated runs (alone, and with the whole `packages/activerecord/src/relation`
directory), and a bare re-run of the same commit with no code change was fully
green.

## Acceptance criteria

- Root cause identified — a stale query-cache read, a fixture/transaction
  visibility gap, or a real ordering bug in the test.
- If it is a product bug, fixed with a regression test that fails on baseline.
- If it is a test-harness bug, the test is made deterministic WITHOUT renaming
  it and without weakening what it asserts (it is the regression cover for
  #7085's `ImmutableString#serialize` fix).
- Reproduced or ruled out on SQLite, PostgreSQL and MySQL/MariaDB, since it has
  been seen on two of the three.
