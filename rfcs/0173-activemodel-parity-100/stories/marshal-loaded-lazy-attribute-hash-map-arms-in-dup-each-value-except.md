---
title: "ruby-compat: Hash#dup / each_value / except have no Map arm, so a Marshal-loaded LazyAttributeHash reads as empty"
status: done
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8534
claim: "2026-10-05T15:05:13Z"
assignee: "marshal-load-cannot-allocate-a-date"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `lazy-attribute-hash-marshal-load-is-a-static`. ruby-compat's `Marshal.load` answers a
Ruby Hash as a `Hash` (a `Map` subclass, `packages/ruby-compat/src/hash.ts:762`), so a
Marshal-loaded `LazyAttributeHash` holds Maps in `@types`, `@values`, `@additional_types`,
`@default_attributes` and `@delegate_hash`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:97-104,142-148`).

`fetch`, `hashAref`, `hashAset`, `keys`, `transformValues`, and now `hasKey` and `eachKey`, have a
Map arm. `dup`, `eachValue` and `except` (`packages/ruby-compat/src/hash.ts`) do not: they read
`Object.keys` of the receiver. So on a loaded hash `LazyAttributeHash#initialize_dup`
(`builder.rb:124-127`, `Hash[delegate_hash]`), `#each_value` and `#except` (`builder.rb:95`,
delegated to `materialize`) answer as if the hash were empty. `rbEqual` of a Map-backed Hash and a
plain-object Hash with the same pairs is also false, so `loaded == original` (`builder.rb:134-140`)
is false where Rails answers true.

## Acceptance criteria

- [ ] `dup`, `eachValue` and `except` in `packages/ruby-compat/src/hash.ts` walk a Map-backed
      receiver's own table, as `rb_hash_dup` / `rb_hash_each_value` / `rb_hash_except` do.
- [ ] `Marshal.load(Marshal.dump(lazyAttributeHash))` is `equals` to the original, and its `dup`,
      `eachValue` and `except` answer what the original's do; a trails test pins each.
