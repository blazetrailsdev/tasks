---
title: "Port Ruby's Class === as one ruby-compat test; replace the fragile /^class[\\s{]/ copies in validatesWith and ensureOptionNotGivenAsClassBang"
status: draft
updated: 2026-09-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Three ports stand in for Ruby's `Class === x` (`Module#===`, `rb_mod_eqq`,
`vendor/ruby/object.c:1771`, registered at `:4430`) without a ruby-compat port of it.
Two of them stand in for a Ruby type test on `Class` with the source regex
`/^class[\s{]/.test(Function.prototype.toString.call(x))`:

- `packages/activemodel/src/validations/with.ts:66` (`validatesWith`), which
  decides whether the trailing function is the `&block` or a validator class.
  In Ruby the block is syntactically separate
  (`activemodel/lib/active_model/validations/with.rb:88`, `:144`).
- `packages/activerecord/src/reflection.ts:434`
  (`ensureOptionNotGivenAsClassBang`), where Rails checks
  `options[option_name].class == Class`
  (`activerecord/lib/active_record/reflection.rb:360-364`).

In trails#7982 the reviewer showed that this regex misclassifies valid classes:

- `class/**/{}` and `class // c\n{}`: a comment right after `class` fails `[\s{]`;
- `new Proxy(SomeClass, {})`: `toString` reports `function () { [native code] }`;
- built-in constructors.

So `validatesWith(Klass)` with such a class pops it as the block, and
`ensureOptionNotGivenAsClassBang` lets a proxied class through with no
`ArgumentError`.

trails#7982 converged `CallTemplate.build` in
`packages/activesupport/src/callbacks.ts` onto a two-arm test, and the reviewer
accepted it:

- (a) `/^class(?=[\s{/])(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*[^(\s/]/` on the
  source, which skips comments and rejects a method named `class`; or
- (b) `[native code]` source, a non-writable own `prototype`, and not frozen.
  This catches a Proxy of a class or a built-in, while keeping frozen or
  hand-locked ordinary functions as functions.

The one residual is a frozen Proxy of a class, which JS cannot tell apart from a
function without `[[Call]]`. That makes three hand-rolled copies of one Ruby type
test, and two of them are the weak version.

## Acceptance criteria

- A single ruby-compat port of the `Class === x` test, named per
  `docs/ruby-ts-conventions.md`, with the two-arm body above and its `object.c`
  cite. Check first for an existing `rbObjIsKindOf`-style export. All three
  sites use it: `callbacks.ts` `CallTemplate.build` (Rails `when ::Proc`,
  `activesupport/lib/active_support/callbacks.rb:500`), `with.ts:66` and
  `reflection.ts:434`. The inline copies are deleted.
- `ensure_option_not_given_as_class!` raises for `class/**/{}` and for a Proxy
  of a class. `validatesWith` treats both as validator classes, not as the
  block. Add a regression for each, and check it fails on the old regex.
- `parity:api:calls`, `parity:api:calls:args` and `parity:api:extra:gate` stay
  green.
