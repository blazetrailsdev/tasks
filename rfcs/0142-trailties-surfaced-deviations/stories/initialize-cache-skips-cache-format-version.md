---
title: "initialize-cache-skips-cache-format-version"
status: ready
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `initialize_cache` opens with
`cache_format_version = config.active_support.delete(:cache_format_version)` /
`ActiveSupport.cache_format_version = cache_format_version if cache_format_version`
(`railties/lib/rails/application/bootstrap.rb:78-79`). trails' `initialize_cache`
(`packages/trailties/src/application/bootstrap.ts`, converged onto `lookup_store` by
trails#8101) omits both lines, because there is no `ActiveSupport.cacheFormatVersion`
seat: Rails defines `def self.cache_format_version` / `=` on the `ActiveSupport` module
(`activesupport/lib/active_support.rb:106-112`), delegating to `Cache.format_version`,
which trails has as `formatVersion` / `setFormatVersion` in
`packages/activesupport/src/cache/store.ts`. `load_defaults` already writes
`activeSupport.cacheFormatVersion` (`packages/trailties/src/application/configuration.ts`,
the 7.0/7.1 arms), so today that value is never applied.

## Acceptance criteria

- `ActiveSupport.cacheFormatVersion` / `setCacheFormatVersion` exist on the `ActiveSupport`
  module (`activesupport/src/namespaces.ts`), delegating to `Cache.formatVersion`.
- `initialize_cache` deletes `cacheFormatVersion` from `config.activeSupport` and applies it
  when set, as `bootstrap.rb:78-79` does.
- A test boots with `loadDefaults(7.0)` and asserts the cache format version is 7.0.
