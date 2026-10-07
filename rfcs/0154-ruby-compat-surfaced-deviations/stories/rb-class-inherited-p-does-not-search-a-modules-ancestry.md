---
title: "rbClassInheritedP answers nil for a module receiver or a module's own ancestry, where Module#<= answers true or false"
status: draft
updated: 2026-10-07
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

`rb_class_inherited_p` (`vendor/ruby/v3.3.11/object.c:1778-1815`) answers
`Qfalse` when `arg` has `mod` in its ancestry: its last arm is
`class_search_ancestor(arg, mod)`, and `arg` may be a module. So
`Comparable <= String` is `false` (String includes Comparable), and
`Kernel <= Comparable` is `nil`.

ruby-compat's `rbClassInheritedP` (`packages/ruby-compat/src/include.ts`,
added by trails PR 8647) calls the module-private `classSearchAncestor(cl, c)`
for both arms, and that walks `cl.prototype`. A module is a `Module` instance
or a plain object and has no `prototype`, so with a module as `mod` (first
arm) or as `arg` (second arm) the walk never runs:

- `rbClassInheritedP(Mod, Klass)` where `Klass` includes `Mod` answers `null`,
  where Ruby answers `false`.
- `rbClassInheritedP(ModA, ModB)` where `ModA` includes `ModB` answers `null`,
  where Ruby answers `true`.

No caller reaches either today: msgpack's `Packer#type_registered?`
(`vendor/msgpack/v1.8.0/lib/msgpack/packer.rb:27`) and
`msgpack_packer_ext_find_superclass`
(`ext/msgpack/packer_ext_registry.h:46-61`) pass a class as `mod`, and only
truthiness is read.

## Acceptance criteria

- `classSearchAncestor` searches a module's own ancestry (the modules it
  includes), as `class_search_ancestor` (`object.c:935`) walks a module's
  superclass chain of iclasses.
- `rbClassInheritedP(Mod, Klass)` is `false` when `Klass` includes `Mod`, and
  `rbClassInheritedP(ModA, ModB)` is `true` when `ModA` includes `ModB`, each
  with a test that fails on the baseline.
