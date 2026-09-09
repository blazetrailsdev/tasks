---
title: "Port PartialRenderer collection caching"
status: in-progress
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages:
  - "actionview"
deps: []
deps-rfc: []
est-loc: 250
priority: 22
pr: 7643
claim: "2026-09-09T13:36:21Z"
assignee: "collection-caching-for-partial-renderer"
blocked-by: null
closed-reason: null
---

## Context

`renderer/partial_renderer/collection_caching.rb` (8 methods) is absent.
`PartialRenderer` is present but at 5/13 methods, and this file is the largest
single reason.

It is the `cached: true` path for `render partial:, collection:` — it reads and
writes many fragments in one `read_multi` / `write_multi` round trip against
`PartialRenderer.collection_cache`, keyed through `digest_path_from_template`.
`railtie.rb:103-105` sets `PartialRenderer.collection_cache =
app.config.action_controller.cache_store`.

It depends on the digest chain: the cache key comes from `Digestor`, so this
story is only meaningful once
`actionview-digestor-is-a-stub-not-a-dependency-tree-digest` (RFC 0123, ready)
has landed the tree walk. Claim it after that, or the cached keys are the stub's
and every collection shares one.

## Converged shape

`packages/actionview/src/renderer/partial-renderer/collection-caching.ts`,
mixed into `PartialRenderer` at Rails' site.

## Acceptance criteria

- `renderer/partial_renderer/collection_caching.rb` reports 0 missing in
  `pnpm parity:api --package actionview`.
- A collection render with `cached: true` issues one multi-read rather than one
  read per element, asserted against a recording cache store.
- A changed partial changes the cached keys — the test fails against the fnv1a
  stub, so it must be written after RFC 0123's story lands.
- Instrumentation payload keys match Rails' (`:count`, `:cache_hits`).
