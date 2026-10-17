---
title: "Port SolidCache::Entry and SolidCache::Store over ActiveRecord"
status: draft
updated: 2026-10-17
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-cache"]
deps: ["solid-cache-package-skeleton"]
deps-rfc: []
est-loc: 650
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SolidCache::Store` (`vendor/solid_cache/v1.0.7/lib/solid_cache/store.rb` and
its `store/*.rb` modules: `api`, `clusters`, `connections`, `entries`,
`expiry`, `failsafe`, `stats`) subclasses `ActiveSupport::Cache::Store`.
The trails base class is async already
(`packages/activesupport/src/cache/store.ts`, through
`cache-store-async-store-and-local-stores`). `SolidCache::Entry`
(`app/models/solid_cache/entry.rb` plus `entry/*.rb`) is an AR model over
`solid_cache_entries`, created by the gem's `db/cache_schema.rb`.

## Acceptance criteria

- `Entry` and the `Store` modules are ported at their Rails names, with the
  methods in Rails order. The schema comes from the gem's `cache_schema.rb`,
  not from a bespoke table.
- The gem's store tests (`test/unit/*_test.rb`) that reuse ActiveSupport's
  cache behaviors are run through
  `packages/activesupport/src/cache/behaviors`.
- If this goes over the PR ceiling, ship `Entry` plus the `api` / `entries`
  modules and file the rest (`expiry`, `clusters`, `failsafe`, `stats`) as
  stories.
