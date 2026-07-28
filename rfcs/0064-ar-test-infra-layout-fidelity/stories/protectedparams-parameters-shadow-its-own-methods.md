---
title: "ProtectedParams stores parameters on the instance, so they shadow its methods"
status: draft
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ProtectedParams` stub keeps its parameters in a `@parameters` ivar and
delegates the hash reads to it:

```ruby
class ProtectedParams
  delegate :keys, :key?, :has_key?, :empty?, to: :@parameters

  def initialize(parameters = {})
    @parameters = parameters.with_indifferent_access
    @permitted = false
  end
```

(`vendor/rails/activerecord/test/support/stubs/strong_parameters.rb:5-11`.)

trails' port (`packages/activerecord/src/support/stubs/strong-parameters.ts`)
instead spreads the parameters onto the instance itself
(`Object.assign(this, parameters)` behind an index signature) so the object
iterates like a hash and supports `params[key]`. The methods then read off
`this`.

The cost is that a parameter named after one of the class's own methods
shadows it — `new ProtectedParams({ keys: [...] })` replaces `keys()` with an
array. Rails has no such hazard because the parameters never share a namespace
with the methods. PR #5517 widened the exposed surface from three methods
(`permitted`, `permit`, `toH`) to ten (`keys`, `isKey`, `hasKey`, `isEmpty`,
`permitted`, `permitBang`, `toH`, `toUnsafeH`, `eachPair`, plus the
constructor), so the collision surface grew with it.

No canonical-schema column currently collides, so nothing fails today — this is
a latent trap, documented in the file's docblock, not a live bug. It is filed
so the deviation is tracked rather than only described in prose.

Converging means storing the parameters in a private field (`#parameters`) and
either dropping the index-signature/`params[key]` affordance or providing it
through a `Proxy`. Check every call site before choosing: the AR tests use
`params[key]` and object spread against these stubs
(`forbidden-attributes-protection{,.trails}.test.ts`, `finder.test.ts`,
`relation/where.test.ts`), and `toH()` is currently `{ ...this }`.

Note the sibling real port, actionpack's `Parameters`
(`action-controller/metal/strong-parameters.ts`), already stores in a private
`_data` and does not have this hazard — it is the shape to copy.

## Acceptance criteria

- `ProtectedParams` no longer stores parameters as own properties on the
  instance; a parameter named `keys` / `empty` / `permitted` / `toH` cannot
  shadow the corresponding method.
- A regression test pins that (it must fail on the current implementation).
- `params[key]` access and `toH()` keep working for every existing call site;
  the four AR test files above still pass unchanged.
- `pnpm api:compare --package activerecord-test-support` stays at 32/32.
