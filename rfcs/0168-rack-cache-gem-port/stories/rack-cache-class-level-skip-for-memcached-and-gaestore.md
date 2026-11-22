---
title: "rack-cache-class-level-skip-for-memcached-and-gaestore"
status: closed
updated: 2026-11-22
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10552
claim: "2026-11-22T03:35:34Z"
assignee: "gate-rack-cache-extra-surface"
blocked-by: null
closed-reason: "FALSIFIED: the MemCached/GAEStore members are not counted missing. parity:api folds them into the same-named Heap/Disk/Dalli methods of meta_store.rb / entity_store.rb (same-name collapse), so the rack-cache total is 157 with or without a class skip; trails#10552 measured both."
---

## Context

RFC 0168 skips the `MemCached` and `GAEStore` classes inside
`vendor/rack-cache/v1.17.0/lib/rack/cache/meta_store.rb:362-439` and
`entity_store.rb:245-331` (memcached gem / JRuby GAE). `parity:api` offers no
class-level skip that fits: `SCOPED_SKIP_GROUPS` (`scripts/parity/conventions.ts`)
is keyed by method name per file, so it would also skip the same-named
`Dalli` / `Heap` / `Disk` members in those files, and `RUBY_ONLY_CLASSES` is
reserved for stdlib-gap classes. `enroll-rack-cache-in-compare-tooling` left
these members counted as missing in the `rack-cache` row (157 methods).

## Acceptance criteria

- [ ] A class-scoped skip (e.g. an `fqn`-keyed unported entry) excludes
      `Rack::Cache::MetaStore::MemCached`, `::GAEStore`,
      `Rack::Cache::EntityStore::MemCached`, `::GAEStore` with the RFC reason.
- [ ] The `rack-cache` row's method total drops by those classes' members only.
