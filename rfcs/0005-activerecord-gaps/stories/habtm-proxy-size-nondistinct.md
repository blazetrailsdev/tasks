---
title: "HABTM collection proxy size() returns deduped count for non-distinct collections"
status: in-progress
updated: 2026-06-12
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 50
priority: 20
pr: 3143
claim: "2026-06-12T01:20:59Z"
assignee: "habtm-proxy-size-nondistinct"
blocked-by: null
---

## Context

For a non-distinct HABTM collection (e.g. `Developer.projects` without `.distinct`),
`proxy.size()` returns the _in-memory deduped_ target length (e.g. 1) while
`toArray()` re-queries and returns all join rows (e.g. 3). Rails `dev.projects.size`
returns 3 for the non-distinct collection.

Blocks the `distinct after the fact` test in `has-and-belongs-to-many-associations.test.ts`
from migrating to canonical fixtures — that test expects `size == 3, uniq == 1`.
The other three distinct-family tests (`before the fact`, `option prevents duplicate
push`, `when association already loaded`) DO pass faithfully in probes.

Root cause: `_addToTarget` deduplication runs unconditionally rather than being
gated on whether the collection scope is distinct.

## Acceptance criteria

- [ ] `proxy.size()` for a non-distinct HABTM collection returns the raw join-row count
- [ ] Distinct collections retain their existing dedup behaviour
- [ ] `distinct after the fact` test passes faithfully (no stubs)
- [ ] `api:compare` delta non-negative
