---
title: "Converge Store logger shim to real Cache::Store base class"
status: claimed
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-19T22:34:11Z"
assignee: "cache-store-logger-converge-to-base-class"
blocked-by: null
---

## Context

PR #3676 added a module-level `Store` object in `packages/activesupport/src/cache/index.ts`:

```ts
export const Store = {
  logger: null as CacheLogger | null,
  with<T>(options: { logger: CacheLogger }, fn: () => T): T { ... },
};
```

This is trails-local scaffolding — Rails has a real `ActiveSupport::Cache::Store` base class that holds `logger` as a class-level attribute (`cache.rb`). The shim exists because no `Store` base class has been ported yet.

When `Cache::Store` is ported, the `logger`/`with` surface should migrate from this module-level shim into the class, and `SerializerWithFallback` should import from the class rather than from `index.ts`.

## Acceptance criteria

- `Cache::Store` base class exists in trails.
- `Store.logger` is a class-level attribute on `Cache::Store` (not a module-level object in `index.ts`).
- `SerializerWithFallback`'s `sharedLoad` references `Store.logger` from the base class.
- The temporary shim in `cache/index.ts` is removed.
