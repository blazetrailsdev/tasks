---
title: "Adapter hash-only constructor (Initiative 3)"
status: blocked
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: "Phase 0 gated on trails #2700 (proposed; no code yet)"
---

## Context

The third initiative consolidated into `adapter-architecture-cleanup.md`:
Rails-faithful adapter construction via a hash-only constructor. Currently
**proposed (no code)**; Phase 0 is gated on trails #2700. Captured here so the
source doc can be deleted without losing the initiative.

## Acceptance criteria

- [ ] Phase 0 unblocked (#2700 resolved) — re-scope against the then-current
      adapter constructors.
- [ ] Concrete adapters (PG / MySQL2 / SQLite) accept a Rails-shaped hash-only
      constructor.
- [ ] Existing positional construction paths migrated or bridged.

## Notes

Migrated from `adapter-architecture-cleanup.md` Initiative 3 during the RFC 0011
cutover. Stays `blocked` until #2700 lands. Related to
[pool-raw-connection-initialize-overload](../../0005-activerecord-gaps/stories/pool-raw-connection-initialize-overload.md)
(constructor restructure across PG/MySQL2).
