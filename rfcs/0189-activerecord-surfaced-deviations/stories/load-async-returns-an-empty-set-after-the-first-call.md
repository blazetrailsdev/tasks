---
title: "load_async returns an empty set for every call after the first in a process"
status: in-progress
updated: 2026-10-12
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: trails#8820
claim: "2026-10-12T15:52:15Z"
assignee: "load-async-returns-an-empty-set-after-the-first-call"
blocked-by: null
closed-reason: null
---

Surfaced by trailmap#59 (`/graphs/parity` on a Postgres projection).

**Only the FIRST `loadAsync()` in a process returns rows. Every later one
answers an empty set, and does so silently.**

Measured against Postgres, three relations over the same 14k-row table, each
of which returns 209 rows when loaded normally:

```text
--- three scheduled, consumed in order
  [0] 209
  [1] 0
  [2] 0
--- three scheduled, consumed in REVERSE order
  [2] 0
  [1] 0
  [0] 209          <- the first SCHEDULED one, not the first consumed
--- one scheduled at a time, consumed immediately
  api: 0
  test: 0
  api_privates: 0  <- after the first loadAsync anywhere in the process
--- await between scheduling
  api then test: 0
```

The reproduction is four lines and needs no concurrency:

```ts
const rel = (m: string) => ParityDay.where({ metric: m }).order({ day: "asc" });
await rel("api").loadAsync().toArray(); // 209
await rel("test").loadAsync().toArray(); // 0, and `rel("test").toArray()` is 209
```

Sequential `toArray()` on the same relations is correct throughout, so this is
`loadAsync` and not the query, the scope or the connection.

What makes it worth a p1 rather than a curiosity is that it **fails silently**.
There is no error and no warning; a page that charts two series renders one and
looks fine. trailmap lost every series after the first and would have shipped
it had the ringo gate not diffed the JSON against ringo's own endpoint. Any
caller following Rails' documented shape for `load_async` — schedule several,
then consume them — gets wrong data, confidently.

Not yet established, and worth finding out first: whether the state that leaks
is per-process, per-connection or per-pool (trailmap's hub pool is the default
size, and the probe above ran on one connection), and whether SQLite behaves
the same or this is specific to the PostgreSQL adapter.

## Expected shape

Rails' `load_async` schedules a query and returns the relation; the records are
there when the relation is consumed, however many were scheduled first and in
whatever order they are consumed. `relation.load_async` is explicitly built to
be called on several relations before any of them is read — that is the whole
feature.

## Acceptance

- [ ] a test that schedules THREE relations with `loadAsync`, then consumes
      them, and asserts all three carry their rows — it fails on the current
      code with two empty sets
- [ ] the same test consuming them in reverse order
- [ ] a test that a `loadAsync` after an earlier `loadAsync` has been fully
      consumed still returns rows, which is the one-at-a-time case above
- [ ] run on both the SQLite and PostgreSQL lanes, since it is not yet known
      whether the defect is adapter-specific
