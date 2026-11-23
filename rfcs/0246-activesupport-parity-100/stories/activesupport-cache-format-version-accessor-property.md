---
title: "activesupport-cache-format-version-accessor-property"
status: done
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10607
claim: "2026-11-22T22:24:08Z"
assignee: "activesupport-cache-format-version-accessor-property"
blocked-by: null
closed-reason: null
---

## Context

Rails `ActiveSupport::Cache` defines `format_version` as a singleton `attr_accessor`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb:55-58`). Under root
CLAUDE.md § "Generated attribute readers are properties", a zero-arg reader ports as an
accessor property: `get formatVersion` / `set formatVersion` on `ActiveSupport.Cache`.
With that property, `objectWith(ActiveSupport.Cache, { formatVersion }, block)` keeps
working, and it is the port of `Cache.with(format_version:)`.

trails#10553 ported it as `formatVersion()` / `setFormatVersion()` in
`packages/activesupport/lib/cache.ts`, because `scripts/api-compare/extract-ts-api.ts`
credits only module functions there. A data property on the namespace object
(`namespaces.ts`) scored `format_version` / `format_version=` as missing. The value stays
seated at `ActiveSupport.Cache._formatVersion` (`cache/store.ts`), because
`actionview/lib/renderer/partial-renderer/collection-caching.ts` builds a `MemoryStore`
at module-eval time.

## Acceptance criteria

- [ ] The extractor credits a `get`/`set` accessor seated on a namespace object (e.g.
      `Object.defineProperty(ActiveSupport.Cache, "formatVersion", { get, set })` in
      `cache.ts`) as the Ruby reader and writer.
- [ ] `formatVersion` is that accessor property. `formatVersion()` / `setFormatVersion()`
      are removed, and the cache test behaviors' `withFormat` helpers use `objectWith`
      again.
- [ ] `cache.rb` stays at 100% on `parity:api`.
