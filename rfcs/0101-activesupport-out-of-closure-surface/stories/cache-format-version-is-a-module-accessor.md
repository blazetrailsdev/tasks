---
title: "Cache.format_version is a module accessor Object#with can scope"
status: draft
updated: 2026-11-11
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails declares `mattr_accessor :format_version` on `ActiveSupport::Cache`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb:50`), so
`ActiveSupport::Cache.with(format_version: v) { ... }` (`Object#with`) scopes it. The behavior test's
`with_format` does exactly that (`vendor/rails/v8.0.2/activesupport/test/cache/behaviors/cache_store_format_version_behavior.rb:117-120`).

trails ports it as a `formatVersion()` / `setFormatVersion()` function pair (`packages/activesupport/lib/cache/store.ts:24-32`),
re-exported onto `ActiveSupport.Cache` (`lib/cache.ts:91-102`). `objectWith` (`lib/core-ext/object/with.ts`) cannot read
or assign that pair, so `test/cache/behaviors/cache-store-format-version-behavior.ts` (trails#10006) hand-rolls the
save, assign and restore in `withFormat`.

## Acceptance criteria

- [ ] `formatVersion` is a `mattrAccessor`-style accessor on `ActiveSupport.Cache` (read `Cache.formatVersion`, write `Cache.formatVersion = v`), and every caller of `formatVersion()` / `setFormatVersion()` converges onto it.
- [ ] `withFormat` in cache-store-format-version-behavior.ts (and the serializer/compression behaviors) becomes `objectWith(ActiveSupport.Cache, { formatVersion }, block)`.
