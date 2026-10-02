---
title: "ruby-compat: Module#superMethod resolves the next method on every call (133 ns vs 6 ns); Numeric#cast pays it"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Module#superMethod` (`packages/ruby-compat/src/include.ts:463`) is the port of Ruby's `super`
from a module method (`vm_search_super_method`, `vendor/ruby/v3.3.11/vm_insnhelper.c:4648`). It
resolves the next method on every call: it walks the receiver's prototype chain to the module's
link (`isLinkOf`: a `WeakMap` read and an `Array#includes` per level), reads a property
descriptor per level above it, and returns a fresh `bind`.

Measured on the built `dist` (1M iterations, best of 7): a module method calling
`M.superMethod(this, "cast")(v)` costs 133 ns/op where a class method calling `super.cast(v)`
costs 6 ns/op.

`type-helpers-numeric-is-a-class-factory-not-an-included-module` put that call on a hot path:
`ActiveModel::Type::Helpers::Numeric#cast` and `#changed?`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/type/helpers/numeric.rb:15-34`) now reach
`super` through it. Best of 5 over 1M iterations, before and after that PR:

| call                                   | class factory | included module |
| -------------------------------------- | ------------- | --------------- |
| `IntegerType#cast(42)`                 | 68 ns         | 407 ns          |
| `IntegerType#cast("42")`               | 470 ns        | 1493 ns         |
| `FloatType#isChanged(1.5, 2.5, "2.5")` | 73 ns         | 326 ns          |

`Type::Integer#serialize` calls `cast` (`type/integer.rb:60-63`), so every Integer bind and every
user-assigned numeric attribute pays it. CLAUDE.md § "Method visibility is compile-time only"
removed a 440 ns second prototype walk from the same path.

Other callers: `activemodel/src/attributes.ts:33,38,65`, `activemodel/src/dirty.ts:159-198`,
`actionview/src/rendering.ts:191,201`.

## Acceptance criteria

- [ ] `superMethod` resolves the next method once per (module, receiver prototype, name) and
      reuses it, invalidated by whatever relinks a module (`relinkIncluders`, a later `include`).
- [ ] A call costs within 2x of a native `super` call on the benchmark above; the three Numeric
      rows return to within 1.5x of their class-factory numbers.
- [ ] The numbers are in the PR body.
