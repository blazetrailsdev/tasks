---
title: "Converge the Caching include site onto ActiveSupport::Configurable"
status: ready
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Configurable` is ported — `packages/activesupport/src/configurable.ts`
exports `Configuration`, `Configurable.ClassMethods.config`, `.configure` and
`.configAccessor` — but the `AbstractController::Caching` include site does not
use it. PR #7560 hand-rolled two things it already provides:

- `packages/actionpack/src/action-controller/base.ts` generates the three
  `config_accessor` slots (`defaultStaticExtension`, `performCaching`,
  `enableFragmentCacheLogging`) with an `Object.defineProperty` loop over
  `CACHING_SLOTS`, reimplementing `config_accessor`
  (`vendor/rails/actionpack/lib/abstract_controller/caching.rb:34,38,41`).
- The class-side `cacheStore` accessor at the same site is backed by a
  symbol-keyed slot, because the port has no `config` object on a controller
  class for both receivers to share. That is exactly what
  `Configurable::ClassMethods#config` provides
  (`vendor/rails/activesupport/lib/active_support/configurable.rb:35-44`), and
  `Configurable#config` delegating the instance to `self.class.config`
  (`configurable.rb:104-106`) is what lets Rails' one `cache_store` body serve
  both receivers.

The second one is the load-bearing consequence: with a real `config` receiver,
`ConfigMethods`' `cacheStore` reader/writer become
`config.cacheStore` / `config.cacheStore = lookupStore(store)` verbatim
(`caching.rb:14-21`), and `extend ConfigMethods` (`caching.rb:32`) can be
mirrored literally with `extend()` instead of a second accessor pair.

## Converged shape

- `ActionController::Base` gets `Configurable`'s `config` / `configure` /
  `configAccessor` class methods and the instance `config` delegator.
- The include site calls `configAccessor` for the three slots, deleting the
  `defineProperty` loop and `CACHING_SLOTS` / `CACHING_DEFAULTS` if nothing
  else reads them.
- `ConfigMethods`' two accessors read and write `config.cacheStore`, and the
  class side comes from `extend(Base, ConfigMethods)` rather than the
  symbol-slot accessor pair in `base.ts`.
- Drop the PR #7560 deviation note about `extend ConfigMethods` from the record
  once this lands — it exists only because there is no shared `config`.

## Acceptance criteria

- [ ] No `Object.defineProperty` slot loop and no `cacheStoreConfig` symbol in
      `action-controller/base.ts`; the three slots and `cacheStore` come from
      `Configurable`.
- [ ] `ConfigMethods` is mirrored onto the class with `extend()`, one body per
      Rails method.
- [ ] `packages/actionpack/src/action-controller/caching.trails.test.ts` still
      passes unchanged — instance and class `cacheStore` both resolve through
      `lookupStore` and share one store.
