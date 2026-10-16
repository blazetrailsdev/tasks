---
title: "cache-store-async-consumers"
status: draft
updated: 2026-10-16
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["actionview", "actionpack"]
deps: ["cache-store-async-store-and-local-stores"]
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `cache-store-async-over-npm-clients`. Once `cache-store-async-store-and-local-stores` makes the Store async, these synchronous consumers each need a deliberate answer (compare CLAUDE.md § "Serialization's dual sync/async hash"):

- `actionview/src/helpers/cache-helper.ts:45-62`: the view `cache` helper `safeConcat`s `fragmentFor(...)` synchronously, via `readFragment` -> `cacheStore.read` (`actionpack/src/abstract-controller/caching/fragments.ts:85-118`).
- `actionview/src/renderer/partial-renderer/collection-caching.ts:72`: `collectionCache().readMulti(...)`.
- `actionpack/src/action-dispatch/middleware/session/cache-store.ts:58-80`: session read/write/delete.
- `actionpack/src/action-controller/metal/rate-limiting.ts:147` already awaits `increment`.

## Acceptance criteria

- Each consumer above is converted to await the Store, or its sync path is explicitly decided and recorded.
