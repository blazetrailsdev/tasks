---
title: "MemoryStore#initialize guards the DupCoder install on :coder AND :serializer"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6440
claim: "2026-08-12T23:36:53Z"
assignee: "test-compare-scans-rails-behavior-mixin-files"
blocked-by: null
closed-reason: null
---

## Context

`MemoryStore#initialize` installs `DupCoder` unconditionally through an object
spread:

```ts
// packages/activesupport/src/cache/memory-store.ts:49-51
super({ coder: DupCoder, compress: false, ...(options ?? {}) });
```

Rails guards the install on BOTH keys
(`activesupport/lib/active_support/cache/memory_store.rb:72-76`):

```ruby
def initialize(options = nil)
  options ||= {}
  options[:coder] = DupCoder unless options.key?(:coder) || options.key?(:serializer)
  # Disable compression by default.
  options[:compress] ||= false
  super(options)
```

The spread reproduces the `:coder` arm (an explicit `coder:` wins) but drops the
`:serializer` arm: `new MemoryStore({ serializer: ... })` keeps `DupCoder`
installed, where Rails would fall through to `Store#initialize` and build a
`Cache::Coder` over the named serializer. Rails covers this via
`CacheStoreSerializerBehavior`
(`activesupport/test/cache/behaviors/cache_store_serializer_behavior.rb`),
included by `memory_store_test.rb`.

Second, smaller divergence in the same line: Rails' `options[:compress] ||= false`
replaces only `nil`/`false`, whereas the spread lets an explicitly-passed
`compress: undefined` win over the `false` default — the kwarg trap from
CLAUDE.md's "Ruby idioms that do not translate literally".

Sequenced behind `port-cache-store-coder-and-serializer-layer`, which is what
makes the `:serializer` option mean anything at all: until `Store#initialize`
reads `:serializer`, the dropped arm has no observable effect.

## Converged shape

`MemoryStore#initialize` mutates a local options object in Rails' order and with
Rails' guards — `if (!("coder" in options) && !("serializer" in options))
options.coder = DupCoder`, then the `||=` spelling of the `compress` default —
rather than relying on spread precedence.

## Acceptance criteria

- [ ] `new MemoryStore({ serializer: ... })` does NOT install `DupCoder`
      (memory_store.rb:73).
- [ ] The `compress` default follows Ruby `||=` semantics (nil/false only).
- [ ] `pnpm parity:api` delta non-negative.
