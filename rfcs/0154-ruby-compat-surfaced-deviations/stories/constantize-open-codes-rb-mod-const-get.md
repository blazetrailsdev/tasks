---
title: "Port rb_mod_const_get so constantize is Object.const_get alone"
status: draft
updated: 2026-10-01
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

Surfaced by trails PR 8350. Rails' `constantize` is one call,
`Object.const_get(camel_cased_word)`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/inflector/methods.rb:289-291`),
and the `::`-path walk lives in MRI's `rb_mod_const_get`
(`vendor/ruby/v3.3.11/object.c:2423`).

trails' `constantize` (`packages/activesupport/src/inflector.ts`) open-codes
that walk instead: `isValidConstantPath`, a `segments` loop, the table read and
the `NameError` raises are all in the activesupport body. It also differs from
`rbPathToClass` (`packages/ruby-compat/src/variable.ts`, the port of
`rb_path_to_class`, `variable.c:432-474`), which now walks the same table:
`constantize` reads a later segment as any property of the receiver, prototype
chain included, with no constant-shape check on the property read, where
`rbPathToClass` reads only a constant-shaped own property.
`Object.const_get("A::B")` does search ancestors (`rb_mod_const_get` passes
`recur = TRUE` for the first segment and `rb_const_get` semantics after), so
the two are not meant to be identical, but each arm should be the MRI one.

## Acceptance criteria

- [ ] ruby-compat exports `rbModConstGet(mod, name, inherit = true)` porting
      `object.c:2423-2550`: the path split, `wrong constant name` `NameError`,
      per-segment lookup over the `registerConstant` table and the namespace,
      and `uninitialized constant` through `rbModConstMissing`. Receipted
      `@noRailsEquivalent PERMANENT`, with a README row.
- [ ] `constantize` is `return rbModConstGet(Object, camelCasedWord)`;
      `isValidConstantPath` and the loop are deleted from activesupport.
- [ ] `packages/activesupport/src/inflector.test.ts` and
      `constantize-test-cases.ts` stay green with no test renamed.
