---
title: "Converge Cache.retrieve_store_class from a fixed switch to a store registry"
status: done
updated: 2026-08-12
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6423
claim: "2026-08-12T15:56:54Z"
assignee: "converge-mark-for-destruction-slot-writes"
blocked-by: null
closed-reason: null
---

## Context

PR #6415 ported `ActiveSupport::Cache.retrieve_store_class` into
`packages/activesupport/src/cache.ts`. Rails (cache.rb:135-144):

```ruby
def retrieve_store_class(store)
  require "active_support/cache/#{store}"
rescue LoadError => e
  raise "Could not find cache store adapter for #{store} (#{e})"
else
  ActiveSupport::Cache.const_get(store.to_s.camelize)
end
```

Ruby builds the require path from the runtime value, so a store shipped by
ANOTHER gem (`redis-activesupport`, `dalli`) resolves with no change to Rails.
ESM has no call-time autoload — an `import` is eager and its specifier cannot
be built from a runtime name — so the port is a `switch` over the three stores
this package ships (`:memory_store`, `:null_store`, `:file_store`) and raises
Ruby's rescued-LoadError message for anything else.

The functional gap: `lookupStore(":my_own_store")` cannot succeed in trails,
where Rails resolves it. The error message and class already match.

## Converged shape

A registry the way Rails' constant namespace is one: a store package
self-registers its class under its Ruby-symbol name (the same shape trails
already uses for model self-registration), and `retrieveStoreClass` looks the
name up there before raising. The switch is then the seeded contents of the
registry rather than a closed set, and the raise stays byte-identical.

## Acceptance criteria

- `retrieveStoreClass` resolves any registered store name, not a fixed switch.
- The three shipped stores register themselves; `lookupStore(":memory_store")`,
  `(":null_store")` and `(":file_store")` keep working unchanged.
- The unknown-name raise keeps the Rails class and message
  (`Could not find cache store adapter for X (cannot load such file -- active_support/cache/X)`).
- No new eager import pulls FileStore or any Node-only surface into a bundle
  that does not already carry it.
- `pnpm parity:api` delta non-negative; cache suites green on all three lanes.
