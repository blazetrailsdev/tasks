---
title: "activesupport: callback chains are not the __callbacks class attribute, so Callbacks' included do body has no seat"
status: in-progress
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: trails#8440
claim: "2026-10-03T09:55:19Z"
assignee: "activesupport-callbacks-chains-are-not-the-callbacks-class-attribute"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Callbacks`' `included do` block
(`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:67-70`) is

```ruby
included do
  extend ActiveSupport::DescendantsTracker
  class_attribute :__callbacks, instance_writer: false, instance_predicate: false, default: {}
end
```

and every reader and writer goes through that attribute: `get_callbacks` is
`__callbacks[name.to_sym]` (`callbacks.rb:932-934`), `set_callbacks` dups the
inherited Hash on the first write (`:936-945`), and `set_callback` /
`skip_callback` / `reset_callbacks` walk `[self] + descendants` through
`__update_callbacks` (`:691-696`, `:737-749`).

`activesupport-callbacks-is-not-an-includable-concern` made `Callbacks`
(`packages/activesupport/src/callbacks.ts`) a module `include()` accepts, but
its `[included]` hook only extends `ClassMethods`. Neither statement of the
`included do` body has a seat, because the chains are not a class attribute:

- `getCallbackChains(target)` keeps a `Map` under a module-private `CALLBACKS`
  symbol on the PROTOTYPE, copies every inherited chain (`chain.dup()`) on the
  first write, and registers the class with `DescendantsTracker` as a side
  effect of that write.
- `setCallback(target, …)` appends to the target's own chain only. It never
  reaches a descendant that already holds its own map, where Rails'
  `__update_callbacks` does.
- `DescendantsTracker` (`packages/activesupport/src/descendants-tracker.ts`) is
  a namespace of functions taking the class as an argument, so nothing can
  `extend` it.
- The four class methods are also exported as free functions taking a
  `target` (`defineCallbacks(base.prototype, …)`), with ~40 source callers and
  ~300 test callers.

## Acceptance criteria

- [ ] `Callbacks`' `[included]` hook is the Rails body: `extend(base, DescendantsTracker)` and `classAttribute` for `__callbacks` with `instanceWriter: false, instancePredicate: false, default: {}`.
- [ ] `getCallbacks` / `setCallbacks` read and write `__callbacks` as `callbacks.rb:932-945` does, and the `CALLBACKS` symbol map, `getCallbackChains` and `peekCallbackChain` are gone.
- [ ] `setCallback` / `skipCallback` / `resetCallbacks` go through `__updateCallbacks` over `[self] + descendants`, with a `.trails.test.ts` case where a callback set on a parent after a child wrote its own chain reaches the child.
- [ ] If the work is larger than one PR, the free `target`-taking functions are split into their own story rather than left half-converted.
