---
title: "Loading records is ~5x the cost of plucking the same rows: 12.7k SQLite rows take 0.5s to instantiate"
status: ready
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured from trailmap (trailmap#63, 2026-10-12) on the vendored build at
trails `873532aab6`, better-sqlite3 adapter, a 12,682-row `stories` table:

- `Story.all().toArray()` — 520–605ms, about 42µs a record
- five `pluck`s plus a four-column `Story.pluck` over the same rows — 100–110ms in total

The load is synchronous on the SQLite adapter, so for that half second the
process serves nothing else; it is what `/up/deep` and `GET /stories/ready`
stall on. NOT profiled: this is the measurement, not a diagnosis. The cost
could be the per-attribute cast, attribute-set construction, or the
`_loadFromSql` instantiation path
(`packages/activerecord/src/` — `Base._loadFromSql`, the hook trailmap's
"counts stories without instantiating them" test spies on).

Expected shape: instantiating a row should cost the same order as reading it;
Rails loads 12k small rows in tens of milliseconds.

## Acceptance criteria

- [ ] A benchmark in trails loads ~12k rows of a ~25-column SQLite table and reports per-record cost, with the hot path identified
- [ ] Either the cost is cut, or the reason it cannot be is recorded here
