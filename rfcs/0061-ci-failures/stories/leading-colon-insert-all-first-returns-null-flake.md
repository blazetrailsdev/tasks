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
priority: 1
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

## Evidence so far (2026-08-27)

**A stale primary-key sequence was proposed and is now REFUTED.** The refutation
is recorded in full because it is the useful part: an earlier revision of this
story claimed the mechanism was "proven". It was not. Do not re-derive it.

The instrumentation from trails#7106 has fired three times. PostgreSQL (run
33026062066, shard 1/2):

```
  returning:        []
  openTransactions: 1
  topics rows:      [[1,"seed",null],[2,"::Alpha",null]]
```

MariaDB, same run: `returning: [[4]]` with `topics rows`
`[[3,"seed",null],[4,"::Alpha",null]]` — id 4 is the `create` row, i.e.
`LAST_INSERT_ID()` echoing the previous insert rather than a new one.

Those say the INSERT wrote nothing, and the read was never at fault
(`openTransactions: 1` is the test's own pinned connection: `leaseConnection` →
`checkout` → `_resolvePinnedConnection`, `connection-pool.ts:883`, `:1542`).
`insert_all` is `on_duplicate: :skip`, so it emits `ON CONFLICT DO NOTHING` and a
uniqueness conflict is swallowed silently. The only unique index on `topics` is
the PK, so a stale sequence looked like the answer, and forcing one locally
(`setval('topics_id_seq', 1, false)`) reproduced the PostgreSQL output
byte-for-byte.

**A follow-up probe killed that theory.** The diagnostic now attempts a plain
`Topic.create` on the failing path — `create` carries no ON CONFLICT clause, so a
stale sequence must raise. SQLite (run 33027617100, job 98372576941):

```
  returning:        []
  topics rows:      [[2,"seed",null],[3,"::Alpha",null]]
  next insert:      inserted id 5
```

The create SUCCEEDED. No collision, healthy sequence. The ids are load-bearing:
rows 2 and 3 exist and the next insert took 5, so **`insert_all` consumed id 4
and persisted nothing** — with 4 unoccupied there was no uniqueness conflict for
`ON CONFLICT DO NOTHING` to act on, yet the row was skipped.

State of knowledge:

- The write is skipped — not lost afterwards, not misread. (three sightings)
- The connection is correct. (`openTransactions: 1` every time)
- It is NOT a primary-key collision and NOT a stale sequence. (refuted)
- The INSERT reaches the database far enough to allocate an id.

Also ruled out, by measurement rather than reading:

- **Cross-worker database sharing.** Twelve worker processes reporting
  `current_database()` plus `count(DISTINCT pid) FROM pg_stat_activity` for their
  own database showed slots reused strictly sequentially and one backend
  throughout. Worker isolation is sound.
- **Tests interleaving inside a worker.** No global `concurrent` in
  `vitest.config.ts`, and the only two `resetPkSequence` callers are the two
  `beforeEach` hooks (`test-fixtures.ts:259`, `:471`).
- **A stale query cache** (see Context above).

Next question: why does an `ON CONFLICT DO NOTHING` insert skip when no
constraint can be violated? Capture the exact SQL and binds as executed, plus
`changes()`/rowcount rather than only the RETURNING payload, and check whether
the statement executes against the same connection the ids came from.

Local reproduction has failed at every scale tried: 200 back-to-back cycles, the
file alone, the whole `relation/` directory, a 70-file PostgreSQL slice (1,397
tests). Only CI reproduces it, and only intermittently — commit `f33d21be7`
produced one green run and one red run of the same tree.

## Tracking

Instrumentation for this story landed separately in **trails#7106**
(`packages/activerecord/src/relation/leading-colon-string-writes.trails.test.ts`):
when the read comes back empty it now reports the `insert_all` RETURNING ids,
the live contents of `topics`, and `openTransactions`, which splits the
remaining hypotheses on the first line of the failure — write never happened,
row removed in between, or the read is at fault. That PR is diagnostic-only and
does NOT meet the acceptance criteria below.

This story is deliberately left unclaimed with no `pr:` stamp: #7106 does not fix
the flake, and a story that is `in-progress` with a PR number is eligible for the
merge sweep to mark done, which would close this out unfixed. Whoever fixes it
claims it fresh — the eliminations above are the starting point, and the next CI
sighting should carry the diagnostic output.

## Acceptance criteria

- Root cause identified — a stale query-cache read, a fixture/transaction
  visibility gap, or a real ordering bug in the test.
- If it is a product bug, fixed with a regression test that fails on baseline.
- If it is a test-harness bug, the test is made deterministic WITHOUT renaming
  it and without weakening what it asserts (it is the regression cover for
  #7085's `ImmutableString#serialize` fix).
- Reproduced or ruled out on SQLite, PostgreSQL and MySQL/MariaDB, since it has
  been seen on two of the three.
