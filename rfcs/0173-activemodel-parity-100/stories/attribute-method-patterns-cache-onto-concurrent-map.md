---
title: "activemodel: attribute_method_patterns_cache is a Concurrent::Map with initial_capacity"
status: done
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8431
claim: "2026-10-03T00:43:04Z"
assignee: "activemodel-ruby-classpath-carriers-onto-rb-mod-name"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `activemodel-audit-permanent-receipts-root`.
`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:417-419`:

```ruby
def attribute_method_patterns_cache
  @attribute_method_patterns_cache ||= Concurrent::Map.new(initial_capacity: 4)
end
```

and `:422` reads it with `compute_if_absent`. `packages/activemodel/src/attribute-methods.ts`
`attributeMethodPatternsCache` builds a bare `new Map()` and carries
`@missingRailsArgs new — PERMANENT` for the dropped `initial_capacity:`. The same shape is receipted
PERMANENT at `packages/activerecord/src/connection-adapters/abstract/connection-handler.ts`
(`connection_handler.rb:78`, `Concurrent::Map.new(initial_capacity: 2)`).

`Concurrent::Map` is a concurrent-ruby gem class, not a TypeScript shortcoming, and no CLAUDE.md
section ratifies dropping its arguments. ruby-compat already carries concurrent-ruby ports
(`packages/ruby-compat/src/thread-pool-executor.ts`); a `Concurrent::Map` over `Map` that accepts the
`initial_capacity:` kwarg (inert in a single-threaded runtime, as it is a sizing hint in Ruby) and
answers `compute_if_absent` lets both call sites pass what Rails passes.

## Acceptance criteria

- [ ] ruby-compat ports `Concurrent::Map` (`new(initial_capacity:)`, `compute_if_absent`, `clear`, `[]`/`[]=` as its callers need), wrapping `Map`.
- [ ] `attributeMethodPatternsCache` is `new Concurrent.Map({ initialCapacity: 4 })` and `attributeMethodPatternsMatching` calls `computeIfAbsent`; the `@missingRailsArgs` receipt is deleted.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm vitest run packages/activemodel/src/attribute-methods.test.ts
```
