---
title: "asyncLoadTarget should leave dotted collection proxy loaded"
status: claimed
updated: 2026-06-27
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 40
priority: 87
pr: null
claim: "2026-06-27T18:46:32Z"
assignee: "assoc-async-load-target-shares-proxy-state"
blocked-by: null
---

## Context

`association(owner, name).asyncLoadTarget()` (associations/association.ts:392)
does not leave the dotted collection proxy (`firm.clients`) in a loaded state,
so a following `size()`/`toArray()` re-queries instead of reading the prefetched
target. Rails test_async_load_has_many
(has_many_associations_test.rb:3261) expects the async-loaded target to satisfy
`firm.clients.size` and `firm.clients[2]` with no further queries.

Discovered while converging `associations/has-many-associations.test.ts`
(RFC 0019); test `async load has many` is currently `it.skip`.

## Acceptance criteria

- [ ] After `association(owner, name).asyncLoadTarget()`, the dotted
      `owner.<name>` proxy reports loaded and serves reads without re-querying.
- [ ] No regression in async relation/association tests.
