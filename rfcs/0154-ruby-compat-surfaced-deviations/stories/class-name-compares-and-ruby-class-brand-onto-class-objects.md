---
title: "ruby-compat: name comparisons test the class object, and the rubyClass brand retires onto classpaths"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Since trails PR 8416 `rbObjClass` answers the class object (`rb_obj_class`,
`vendor/ruby/v3.3.11/object.c:265`). Two pieces of the name-keyed design it replaced remain in
`packages/ruby-compat`:

- **Name comparisons.** `rbObjClassname(x) === "Hash"` compares a name where Ruby compares a
  class (`Hash === x`, `x.is_a?(Hash)`): `packages/activerecord/src/relation/query-methods.ts:596`,
  `packages/activesupport/src/array-utils.ts:195-199`, `packages/ruby-compat/src/marshal.ts:62,408,458`,
  `packages/ruby-compat/src/comparable.ts:90`, `packages/trailties/src/thor/parser/argument.ts:88,115`,
  `parser/option.ts:78,173`, `parser/arguments.ts:197`, `shell/basic.ts:80`. A subclass of `Hash`
  fails every one of them; the class object does not.
- **The `rubyClass` brand** (`packages/ruby-compat/src/comparable.ts:31`). `Duration`,
  `Duration::Scalar`, `TimeWithZone` and `Date::Infinity` carry their Ruby path as a string
  property that `rbObjClassname` reads before the class. `rb_obj_classname`
  (`variable.c:498`) is `rb_class2name(CLASS_OF(obj))`: the class's own path. The class path
  seat is `classpaths`, written by `rbModConstSet` (`variable.c:3648-3668`).
- **Load order.** `Class < Module` and the `Comparable` includes are wired at the bottom of
  `include.ts`, so `object.ts` loaded alone answers ancestries without them.

## Acceptance criteria

- [ ] Each name comparison is a class-object test (`rbObjClass(x) === Hash`, or `instanceof`
      where Ruby writes `is_a?`).
- [ ] The four branded classes are pathed through `rbModConstSet` on their namespace and the
      `rubyClass` brand is deleted; `rbObjClassname` is `rbModToS(rbObjClass(x))` with no other arm.
- [ ] The seat wiring runs wherever `object.ts` is the entry module, verified with a plain-node
      import of the built `dist/object.js`.
