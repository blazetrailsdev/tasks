---
title: 'Converge attr_internal_naming_format default to Rails'' "_%s"'
status: done
updated: 2026-08-18
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6703
claim: "2026-08-18T14:40:54Z"
assignee: "request-forgery-protection-this-typed-mixin"
blocked-by: null
closed-reason: null
---

## Context

Rails sets `self.attr_internal_naming_format = "_%s"`
(`vendor/rails/activesupport/lib/active_support/core_ext/module/attr_internal.rb:37`),
so `attr_internal :foo` stores into the ivar `@_foo`. trails defaults to
`"_%s_"` (`packages/activesupport/src/module-ext.ts:260`), storing into `_foo_`.

The divergence is enshrined in a name-matched test and shows as a live
assertion-value mismatch: `test_invalid_naming_format`
(`vendor/rails/activesupport/test/core_ext/module/attr_internal_test.rb:47-53`)
opens with `assert_equal "_%s", Module.attr_internal_naming_format`, and the
trails port at
`packages/activesupport/src/core-ext/module/attr-internal.test.ts` asserts
`"_%s_"` instead. `pnpm parity:test --assertions` reports it under
`core_ext/module/attr_internal_test.rb — 1 value mismatches`
(rails `s:_%s` vs trails `s:_%s_`).

The trailing underscore is not a Ruby-to-TS necessity. Ruby's `@_foo` is an
instance variable in a namespace no property shares; trails stores on the object
itself, so `_foo` is an ordinary property name and the extra `_` was presumably
chosen to lower collision odds with a real attribute. That is a preference, not
a language shortcoming — and it is load-bearing for anyone reading Rails docs or
porting a Rails class that names `@_foo` directly.

## Converged shape

- `module-ext.ts:260` becomes `let _attrInternalNamingFormat = "_%s";`, matching
  attr_internal.rb:37.
- `internalStorageKey` (module-ext.ts:277) is unchanged; only the default moves.
- The `attr-internal.test.ts` `invalid naming format` assertion becomes
  `expect(getAttrInternalNamingFormat()).toBe("_%s")`, matching the Rails
  assertion verbatim.

## Risk to check while converging

Dropping the trailing `_` widens the collision surface: `attrInternal(x, "foo")`
would write the property `_foo`, where before it wrote `_foo_`. Sweep the
existing `attrInternal` / `attrInternalReader` / `attrInternalWriter` call sites
for any host that already declares a `_`-prefixed field of the same name before
flipping the default.

## Acceptance criteria

- [ ] The default format is `"_%s"`, matching attr_internal.rb:37.
- [ ] `attr-internal.test.ts`'s `invalid naming format` asserts Rails' `"_%s"`.
- [ ] `pnpm parity:test:assertions` green, with the
      `core_ext/module/attr_internal_test.rb` value mismatch gone and its
      high-water mark tightened.
- [ ] No existing `attrInternal*` call site collides with the shortened key.
