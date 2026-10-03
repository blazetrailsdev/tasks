---
title: "activesupport: Cache::Store#key_matcher reads the namespace from its options only, with Ruby truthiness"
status: draft
updated: 2026-10-03
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Surfaced while shipping trails#8447, which renamed the local in `Store#keyMatcher` so the call gate credits `options[:namespace].call`.

Rails' `key_matcher` (`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb:779-792`) reads the namespace from the options it is handed and nothing else:

```ruby
def key_matcher(pattern, options) # :doc:
  prefix = options[:namespace].is_a?(Proc) ? options[:namespace].call : options[:namespace]
  if prefix
    source = pattern.source
    if source.start_with?("^")
      source = source[1, source.length]
    else
      source = ".*#{source[0, source.length]}"
    end
    Regexp.new("^#{Regexp.escape(prefix)}:#{source}", pattern.options)
  else
    pattern
  end
end
```

Its callers pass `merged_options(options)` (`cache/memory_store.rb:173-175`), so the store-level namespace is already in the hash.

trails' `keyMatcher` (`packages/activesupport/src/cache/store.ts`) deviates in three ways:

- `options` is optional, and the body falls back to `this.options.namespace` when the key is absent (`options && "namespace" in options ? options.namespace : this.options.namespace`). Rails has no such fallback. `MemoryStore#deleteMatched` and `FileStore#deleteMatched` already pass `this.mergedOptions(options)`, so the fallback is dead for them.
- `if prefix` is ported as a bare JS truthiness test, so an empty-string namespace skips the prefix where Ruby's `""` is truthy.
- The `if` / `else` on `source.start_with?("^")` is collapsed into a ternary and the `if prefix ... else pattern` into an early return.

## Acceptance criteria

- [ ] `keyMatcher(pattern, options)` takes a required `options` and reads `options.namespace` only, with no `this.options` fallback; every caller passes merged options as Rails' do.
- [ ] `prefix` is tested with Ruby truthiness (`prefix != null && prefix !== false`), and the branches mirror `cache.rb:781-791` in shape and order.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with no baseline row and no receipt added.
