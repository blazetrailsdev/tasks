---
title: "activesupport: Callbacks is a plain-object module, so its included hook guards a re-include that Concern#append_features refuses"
status: done
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8455
claim: "2026-10-03T18:46:13Z"
assignee: "activesupport-callbacks-is-a-plain-object-not-a-concern-module"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Callbacks` is `extend Concern`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:65`), so its
`included do` body (`:67-70`) runs from `Concern#append_features`, which answers
false for `base < self` (`active_support/concern.rb:134`) and so runs the body
once per hierarchy.

In trails `Callbacks` (`packages/activesupport/src/callbacks.ts`) is a plain
object module with an `[included]` symbol hook. `include()` fires that hook on
every call, even when the module is already present up the chain, so since
trails#8440 the hook opens with `if ("__callbacks" in base) return;`, a guard
Rails does not have. It also extends `ClassMethods` by hand, which `Concern`
does itself. trails already has a `Concern` (`packages/activesupport/src/concern.ts`)
with the Rails `appendFeatures`, used by `Deduplicable` and `UrlFor`.

`DescendantsTracker` (`packages/activesupport/src/descendants-tracker.ts`) is
made extendable by `Object.setPrototypeOf(DescendantsTracker, Module.prototype)`
on the namespace object, because an `Object.assign(new Module(…), {…})` shape
lost a credited method in `parity:api`. See also
`descendants-tracker-defines-the-instance-descendants` and
`descendants-tracker-singletons-dispatch-to-klass`.

## Acceptance criteria

- [ ] `Callbacks` is a `Module` extended with `Concern`, its `included do` body registered through `Concern.included`, and `ClassMethods` extended by `Concern#appendFeatures`.
- [ ] The `"__callbacks" in base` early return is gone, with a `.trails.test.ts` case where including `Callbacks` into a subclass of an includer does not reset the inherited `__callbacks`.
- [ ] `DescendantsTracker` is a `Module` by construction rather than by `setPrototypeOf`, with `descendants_tracker.rb` still at 8/10 or better in `parity:api`.
