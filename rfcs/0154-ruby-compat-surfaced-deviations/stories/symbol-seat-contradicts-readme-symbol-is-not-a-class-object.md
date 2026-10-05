---
title: "ruby-compat: rbCSymbol is seated for Psych's path2class while the README says Symbol has no seat"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `psych-restricted-class-loader-and-no-alias-ruby` (trails#8508).

ruby-compat's README, § "Core classes are class objects; `Symbol` is not one"
(`packages/ruby-compat/README.md:86-98`, recorded by trails#8416 for
`core-class-seats-string-subclasses-hash-each-symbol`), says `Symbol` has no
seat: `rbObjClass` answers `String` for every string and a call site that
discriminates uses `isSymbol`.

trails#8508 added `rbCSymbol = rbDefineClass("Symbol")` in
`packages/ruby-compat/src/object.ts` and seated it with
`registerConstant("Symbol", rbCSymbol)` at the foot of
`packages/ruby-compat/src/variable.ts`. It exists because
`Psych::ClassLoader#symbolize` calls the generated `symbol` reader before
`sym.to_sym` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/class_loader.rb:31-34`),
which is `load 'Symbol'` → `path2class("Symbol")` (`:36-43,51-56`), and
`ClassLoader::Restricted#find` raises `DisallowedClass` unless `'Symbol'` is
permitted (`:92-98`). MRI defines the class at
`vendor/ruby/v3.3.11/string.c:12290` (`rb_define_class("Symbol", rb_cObject)`).

So the code and the README now disagree: `rbPathToClass("Symbol")` answers a
class object that no value is an instance of, `rbObjClass(":name")` still
answers `String`, and `rbCSymbol` is not exported from `index.ts` or listed in
the README table.

## Acceptance criteria

- [ ] The README section is rewritten to the shape the code has: `Symbol` is
      seated as a constant for `path2class` (`string.c:12290`), and no JS value
      is classified as one (`rbObjClass` still answers `String`), with the
      reason kept.
- [ ] `rbCSymbol` has a README row naming its one caller
      (`ruby-compat/src/variable.ts`, read by `Psych::ClassLoader#symbol`).
- [ ] `variable.trails.test.ts` asserts `rbPathToClass("Symbol")` answers
      `rbCSymbol`.
- [ ] If the decision is instead that `Symbol` stays unseated, `rbCSymbol` is
      deleted and `ClassLoader#symbolize` keeps Ruby's `symbol` call by another
      seat decided here; an unseated `Symbol` makes the base loader's
      `symbolize` raise `ArgumentError "undefined class/module Symbol"`.
