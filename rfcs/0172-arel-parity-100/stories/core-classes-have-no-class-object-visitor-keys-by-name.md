---
title: "ruby-compat: seat class objects for the core classes so Object#class answers a class, and retire arel Visitor's name-keyed dispatch"
status: claimed
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: ["ruby-compat", "arel"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-10-02T18:41:59Z"
assignee: "arel-build-quoted-names-the-sql-literal-arm"
blocked-by: null
closed-reason: null
---

## Context

`Arel::Visitors::Visitor#visit` is `dispatch[object.class]`, and its rescue arm walks
`object.class.ancestors` (`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/visitor.rb:27-41`).
`dispatch_cache` (`visitor.rb:17-21`) is keyed by the class object, `compare_by_identity`.

ruby-compat's `rbObjClass` (`packages/ruby-compat/src/object.ts`) answers a class NAME, a String,
because a JS `number` seats both `Integer` and `Float` and `nil` / `true` / a plain Hash / a
Temporal value have no class object at all. trails PR 8363 therefore shipped three workarounds:

- `packages/arel/src/visitors/visitor.ts` — module-private `objectClass()` and the
  `Klass = NodeCtor | string` key type: a class seated under a Ruby path is keyed by its
  constructor, every other value by the name `rbObjClass` answers.
- `packages/ruby-compat/src/include.ts` — `rbModAncestors`' string arm and its `CORE_ANCESTORS`
  table, which hand-lists MRI's ancestors for Integer, Float, String, Symbol, Class, Time, Date,
  DateTime and Hash, with `"Kernel"` / `"BasicObject"` as names.
- the dispatch block's `typeof klass === "string" ? klass : rbModName(klass)`.

## Acceptance criteria

- [ ] ruby-compat seats one class object per core class a JS value can be an instance of
      (NilClass, TrueClass, FalseClass, Integer, Float, String, Symbol, Class, Proc, Time, Date,
      DateTime, Hash, plus Numeric, Comparable, Enumerable, Module, Kernel, BasicObject), each with
      its `rb_mod_name` and its MRI superclass / included modules.
- [ ] A ruby-compat function answers `Object#class` as that class object
      (`rb_obj_class`, `vendor/ruby/v3.3.11/object.c:296`); the name-returning form stays for
      interpolation or is derived from it.
- [ ] `rbModAncestors` has one arm: `CORE_ANCESTORS` and the string arm are deleted.
- [ ] `visitor.ts` has no `objectClass`, no `Klass` union and no string branch in the dispatch
      block: `this.dispatch.get(<object.class>)` and `<object.class>.ancestors`, as `visitor.rb:28,40`.

## Verification

```bash
pnpm vitest run packages/arel/src/visitors packages/ruby-compat/src
pnpm build && pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:extra:gate
```
