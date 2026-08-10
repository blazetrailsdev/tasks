---
title: "Converge withOptions onto full OptionMerger semantics"
status: done
updated: 2026-08-07
rfc: "0093-proxy-dynamic-method-consistency"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 250
priority: 4
pr: 6201
claim: "2026-08-07T21:12:47Z"
assignee: "converge-composite-through-collection-proxy-owner-cols"
blocked-by: null
closed-reason: null
---

## Context

`Model.withOptions` (`packages/activemodel/src/model.ts:534`) mirrors
`Object#with_options` / `ActiveSupport::OptionMerger`
(`vendor/rails/activesupport/lib/active_support/option_merger.rb`). Rails'
OptionMerger uses `method_missing` to merge the default options into the
**last argument of every forwarded method call** (deep-merging when both are
hashes), and supports nested `with_options`. The trails proxy intercepts only
`validates`; every other property is forwarded raw and unbound
(`(target as ...)[prop]` with no `.bind`), so e.g.
`m.validatesPresenceOf(...)`, `m.hasMany(...)` inside the block silently
ignore the defaults, and a forwarded method runs with the proxy as `this`.

## Acceptance criteria

- The `get` trap merges `defaults` into the options argument of **any**
  forwarded function call, matching `option_merger.rb`'s
  `method_missing` (argument-merge semantics: explicit options win over
  defaults, mirroring Rails' `merge` direction).
- Non-function properties forward via `Reflect.get`; forwarded functions are
  correctly `this`-bound.
- Nested `withOptions` composes (inner defaults win), matching Rails.
- Ported tests from `activesupport/test/option_merger_test.rb` where the AM
  surface allows; existing `withOptions` tests stay green.
- `pnpm parity:api` / `parity:api:calls` deltas non-negative.
