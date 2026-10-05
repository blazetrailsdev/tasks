---
title: "ruby-compat: the five core constants Psych::ClassLoader reads are seated in variable.ts and wiped by resetConstants"
status: draft
updated: 2026-10-05
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

Surfaced by `psych-restricted-class-loader-and-no-alias-ruby` (trails#8508).
Sibling of `rb-path-to-class-resolves-no-core-class`, whose context predates it.

`Psych::ClassLoader::CACHE`
(`vendor/ruby/v3.3.11/ext/psych/lib/psych/class_loader.rb:58-65`) is
`::Object.const_get(val)` over the thirteen names at `:7-19`. To let the port be
`rbPathToClass(val)` alone, trails#8508 seated five core constants at the foot
of `packages/ruby-compat/src/variable.ts`:

    registerConstant("Object", Object);
    registerConstant("Exception", Exception);
    registerConstant("Range", Range);
    registerConstant("Regexp", RegExp);
    registerConstant("Symbol", rbCSymbol);

Three things are short of MRI:

- **The seats are not in the defining modules.** MRI seats each class where it
  defines it: `vendor/ruby/v3.3.11/object.c:4201` (`Object`), `error.c:3294`
  (`Exception`), `range.c:2635` (`Range`), `re.c:4752` (`Regexp`),
  `string.c:12290` (`Symbol`). Both moves were built and every
  `packages/ruby-compat/dist/**/*.js` imported as a plain-node entry module on
  trails#8508: `exception.ts` calling `registerConstant` broke 100 entries
  (`Cannot access 'StandardError' before initialization` x95, `'Exception'` x4,
  `'_constants'` x1), because `variable.ts` reaches `exception.ts` through
  `argument-error.ts -> standard-error.ts`; `range.ts` calling it broke 61
  (`'classpaths'` x57, `'_constants'` x4).
- **`resetConstants()` wipes them.** It clears the whole table
  (`variable.ts`, `_constants.clear()`), and nothing re-seats the five, where
  `rb_cObject`'s core constants cannot be removed by test teardown. After a
  reset, `rbPathToClass("Object")` raises until the module is reloaded. A
  `ClassLoader` built afterwards still answers them only because `CACHE`
  captured them at load.
- **Only five are seated.** `rbPathToClass("String")`, `"Hash"`, `"Array"`,
  `"Integer"` and the other `rbDefineClass` seats in `object.ts` still raise,
  which is `rb-path-to-class-resolves-no-core-class`.

## Acceptance criteria

- [ ] One mechanism seats every core class ruby-compat defines, the five above
      included, and the seats survive `resetConstants()`. It is the mechanism
      `rb-path-to-class-resolves-no-core-class` lands, not a second one; if
      that story ships first, this one is the removal of the five
      `registerConstant` lines from `variable.ts`'s foot in favour of it.
- [ ] `variable.ts` no longer imports `exception.ts` or `range.ts` only to seat
      them, or the story records why the cycle keeps the seats there.
- [ ] A plain-node import of every built `dist/**/*.js` as entry module shows
      no new failure against `main`.
- [ ] `variable.trails.test.ts` covers `rbPathToClass` for each of the five
      before and after `resetConstants()`.
