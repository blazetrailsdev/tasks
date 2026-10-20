---
title: "plain-module-extend-reaches-singleton-class"
status: claimed
updated: 2026-10-20
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-20T18:44:16Z"
assignee: "actionpack-module-super-inlined-into-includers"
blocked-by: null
closed-reason: null
---

## Context

Ruby's `obj.extend(mod)` is `rb_extend_object`, which is
`rb_include_module(rb_singleton_class(obj), mod)`
(`vendor/ruby/v3.3.11/eval.c` `rb_extend_object`). So `CLASS_OF(obj)` is the
singleton class and `mod` is in its ancestry.

For a plain-object module, ruby-compat's `extendObject`
(`packages/ruby-compat/src/include.ts`, the plain branch of `extend`) copies the
members onto the object and records `mod` on the object itself
(`trackIncludedModule(klass, mod)`), but makes no singleton class. `rbClassOf`
(`packages/ruby-compat/src/object.ts:206`) therefore answers the object's real
class, and `rbClassInheritedP(rbClassOf(obj), mod)` is false.

msgpack's ext-registry lookup (`packages/msgpack/src/packer.ts`,
`extRegistryLookup` / `extFindSuperclass`, mirroring msgpack-ruby's
`packer_ext_registry.c` lookup on `CLASS_OF`) reads exactly that, so
`packer.test.ts` "when it has no ext type but it was extended by a module which
has one" is parked `it.skip` since msgpack's modules became plain objects
(msgpack-drop-ruby-compat-module-class). The old `Module` carrier passed it
because `Module#extendObject` seated the module on a singleton class.

## Acceptance criteria

- Extending a plain object with a plain-object module makes the module reachable
  through `rbClassOf(obj)`'s ancestry (`rbClassInheritedP(rbClassOf(obj), mod) === true`),
  with no carrier, matching `rb_extend_object`.
- The parked msgpack test runs again, with `defineModule`.
