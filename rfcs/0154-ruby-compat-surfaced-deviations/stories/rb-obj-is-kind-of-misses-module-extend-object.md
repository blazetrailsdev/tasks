---
title: "ruby-compat: rbObjIsKindOf answers false for a module the object was extended with"
status: draft
updated: 2026-10-12
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

`rb_obj_is_kind_of` (`vendor/ruby/v3.3.11/object.c:889`) answers true for a module an object was extended with: `m = Module.new; a = Object.new; a.extend(m); a.kind_of?(m)` is `true` on ruby 3.3.11.

In trails, `extend(obj, mod)` with a `Module` instance goes to `Module#extendObject` (`packages/ruby-compat/src/include.ts`), which splices an iclass link above `obj` and calls `trackIncludedModule(obj, this)`. `rbObjIsKindOf(obj, mod)` then answers `false`: `singletonSearchAncestor` (`include.ts`) only reads an object that owns both `extendedKeys` and `includedModulesKey`, and `extendObject` does not set `extendedKeys`; `classSearchAncestor` walks `rbObjClass(obj).prototype`, which starts above the spliced link.

Measured while writing trails#8827's `TYPE_EXTENDED` load test: `class A {}; const m = new Module(); const a = new A(); extend(a, m); rbObjIsKindOf(a, m)` is `false`. `Marshal.load` of a `TYPE_EXTENDED` object extends through `extendObject` too (`packages/ruby-compat/src/marshal.ts`, `rb_extend_object` at `vendor/ruby/v3.3.11/marshal.c:1928`), so a loaded extended relation is affected the same way.

## Acceptance criteria

- [ ] `rbObjIsKindOf(obj, mod)` is `true` after `extend(obj, mod)` / `mod.extendObject(obj)` for a `Module` instance, and for a module that module includes.
- [ ] A test in `packages/ruby-compat/src/object.trails.test.ts` covers it, and the `TYPE_EXTENDED` load test in `marshal.trails.test.ts` asserts `rbObjIsKindOf(shape, Kind)`.
