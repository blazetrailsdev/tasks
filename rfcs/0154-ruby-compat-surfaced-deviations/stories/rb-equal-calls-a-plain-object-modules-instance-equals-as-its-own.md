---
title: "ruby-compat: rbEqual sends a plain-object module's mixin equals as the module's own =="
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

Found while shipping trails PR 8397, which added `aryIncludes` (`Array#include?`,
`vendor/ruby/v3.3.11/array.c:5222` `rb_ary_includes`) and calls it as
`aryIncludes(includedModules(klass), defineAttributes)` in
`packages/activemodel/src/validations/acceptance.ts` (Rails'
`klass.included_modules.include?(define_attributes)`,
`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/acceptance.rb:20`).

`rb_ary_includes` sends `e == item` to each element. In Ruby every element of `included_modules`
is a `Module`, whose `==` is `rb_obj_equal` — identity (`vendor/ruby/v3.3.11/object.c:4374`) —
unless the module's own class overrides it (`LazilyDefineAttributes#==`, `acceptance.rb:71-73`).
A module's INSTANCE methods are never its own `==`.

A trails plain-object module IS its method table, so `rbEqual(e, item)`
(`packages/ruby-compat/src/rb-equal.ts`, the `equals` / `eql` arms) dispatches to a mixin's
instance method as though it were the module's own `==`. `packages/activerecord/src/base.ts`
`include(Base, { …, equals: _equals, eql: _eql, … })` registers exactly such a module, so
`includedModules(SomeModel)` holds an element whose `equals` is `ActiveRecord::Core#==`
(`packages/activerecord/src/core.ts` `equals`), and `aryIncludes` calls it with `this` bound to
the module object. It answers `false` today only because `this.constructor !== other.constructor`
returns before the body reads record state; a mixin `equals` that read `this` first would throw
or answer wrongly.

## Converged shape

A module object compared by `rbEqual` answers identity unless its own CLASS defines `equals`
(a `Module` subclass instance such as `LazilyDefineAttributes`). Either `rbEqual` recognises a
registered plain-object module and compares identity, or `includedModules` consumers get an
element type that cannot be mistaken for an instance. Decide by reading how `include()` registers
a plain-object module in `packages/ruby-compat/src/include.ts`.

## Acceptance criteria

- [ ] `rbEqual(mod, x)` for a plain-object module carrying an `equals` / `eql` member answers `mod === x` and never calls the member.
- [ ] A `Module` subclass instance overriding `equals` still answers through it, so the acceptance validator's "lazy attribute module included only once" test stays green.
- [ ] A ruby-compat trails test pins both arms, failing on the baseline.

## Verification

```bash
pnpm vitest run packages/ruby-compat/src packages/activemodel/src/validations/acceptance-validation
```
