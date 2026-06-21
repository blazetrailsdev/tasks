---
title: "habtm: CollectionProxy include/transaction/preloaded-size"
status: done
updated: 2026-06-21
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3720
claim: "2026-06-20T15:01:28Z"
assignee: "habtm-collection-proxy-find"
blocked-by: null
---

## Context

Part of RFC 0030 test:compare residual burndown, split out of `a4-habtm-join-aliasing`.
Three HABTM CollectionProxy feature tests in
`packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts`:

- `dynamic find should respect association include` (~1003) — ROOT-CAUSE: eager_load/includes
  declared on the association is not passed through when finding in the collection
  (SCOPE: collection-proxy.ts / preloader.ts).
- `association proxy transaction method starts transaction in association class` (~1024) —
  ROOT-CAUSE: CollectionProxy#transaction delegates to the association class's connection,
  not yet wired.
- `preloaded associations size` (~1282) — ROOT-CAUSE: preloaded habtm collection does not
  expose a size that avoids a COUNT query.

## Acceptance criteria

- [x] All three tests un-skipped and green against canonical SQLite (and PG/MySQL per gate).
- [x] No new gate-mismatches for this file.
