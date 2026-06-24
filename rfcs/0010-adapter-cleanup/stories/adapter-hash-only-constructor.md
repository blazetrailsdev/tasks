---
title: "Adapter hash-only constructor (Initiative 3)"
status: claimed
updated: 2026-06-24
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 150
priority: 14
pr: null
claim: "2026-06-24T15:42:28Z"
assignee: "adapter-hash-only-constructor"
blocked-by: null
---

## Context

The third initiative consolidated into `adapter-architecture-cleanup.md`:
Rails-faithful adapter construction via a hash-only constructor. Captured here
so the source doc can be deleted without losing the initiative.

**Unblocked (verified 2026-06-24):** the Phase 0 gate, trails #2700
("deprecate raw-connection AbstractAdapter#initialize overload"), **merged
2026-05-30**. First task on claim is to re-scope the AC below against the
now-current adapter constructors (post-deprecation). Related constructor
restructure: `pool-raw-connection-initialize-overload` (RFC 0005), which
threads PG/MySQL2 construction.

## Acceptance criteria

- [x] Phase 0 unblocked (#2700 merged 2026-05-30) — re-scope against the
      current adapter constructors on claim.
- [ ] Concrete adapters (PG / MySQL2 / SQLite) accept a Rails-shaped hash-only
      constructor.
- [ ] Existing positional construction paths migrated or bridged.

## Notes

Migrated from `adapter-architecture-cleanup.md` Initiative 3 during the RFC 0011
cutover. Stays `blocked` until #2700 lands. Related to
[pool-raw-connection-initialize-overload](../../0005-activerecord-gaps/stories/pool-raw-connection-initialize-overload.md)
(constructor restructure across PG/MySQL2).
