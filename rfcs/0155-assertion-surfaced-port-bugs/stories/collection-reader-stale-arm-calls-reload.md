---
title: "CollectionAssociation#reader stale arm defers load_target instead of calling reload"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
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

`CollectionAssociation#reader` (`packages/activerecord/src/associations/collection-association.ts`, `get reader()`, tagged `@missingRailsCall reload — PERMANENT` in trails#7797) returns synchronously. On a stale target it runs only `reset()` + `resetScope()` and leaves `load_target` to the proxy's next lazy read.

Rails: `reload if stale_target?` (`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:36-37`), where `reload` = `reset; reset_scope; load_target` (`association.rb:72-78`).

Blocker: an un-awaited `reload()` would start a `loadTarget` query that no other reader joins, and its result could overwrite records pushed in the meantime.

## Converged shape

`reader` calls `reload()`. `loadTarget` keeps one in-flight load per association that `CollectionProxy#loadTarget` joins, so a sync read that fires the reload cannot race later mutations. The PERMANENT tag is removed.

## Acceptance criteria

- [ ] `reader`'s stale arm calls `this.reload()`.
- [ ] An in-flight load is shared between the association and the proxy, with a regression test: stale read, then push, then await, and the pushed record survives.
- [ ] `@missingRailsCall reload` is removed from `reader`.
