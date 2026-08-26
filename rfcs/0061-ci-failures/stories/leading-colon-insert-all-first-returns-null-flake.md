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

## Acceptance criteria

- Root cause identified — a stale query-cache read, a fixture/transaction
  visibility gap, or a real ordering bug in the test.
- If it is a product bug, fixed with a regression test that fails on baseline.
- If it is a test-harness bug, the test is made deterministic WITHOUT renaming
  it and without weakening what it asserts (it is the regression cover for
  #7085's `ImmutableString#serialize` fix).
- Reproduced or ruled out on SQLite, PostgreSQL and MySQL/MariaDB, since it has
  been seen on two of the three.
