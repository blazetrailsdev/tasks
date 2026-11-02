---
title: "loader_for_gem memoizes across its await"
status: draft
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/zeitwerk/src/registry.ts` `loaderForGem` awaits a `package.json` read and `pushDir` between its `Object.hasOwn` check and its assignment, so two concurrent first calls build two loaders. Rails' `||=` is synchronous (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/registry.rb:52-54`). RFC 0213's non-goals still say `GemLoader` is ported; by owner decision on trails#9619 it is not.

## Acceptance criteria

- Concurrent `loaderForGem` calls for one root file answer the same loader.
- RFC 0213's README says `loader_for_gem` reads `package.json` and `GemLoader` is not ported.
- `GemInflector`'s fate is decided, as `loaderForGem` no longer uses it.
