---
title: "ruby-compat: extend(obj, mod) includes into the object's singleton class, as rb_extend_object does"
status: in-progress
updated: 2026-10-15
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8922
claim: "2026-10-14T23:49:36Z"
assignee: "activesupport-message-pack-constants-seated-on-their-namespace"
blocked-by: null
closed-reason: null
---

## Context

`rb_extend_object` (`vendor/ruby/v3.3.11/eval.c:1713-1716`) is `rb_include_module(rb_singleton_class(obj), module)`: extending an object gives it a singleton class whose ancestry holds the module, and `rb_class_of(obj)` answers that singleton class.

ruby-compat's `Module#extendObject` (`packages/ruby-compat/src/include.ts`, reached from `extend(obj, mod)`) splices a `T_ICLASS` link as the object's prototype and creates no singleton class, so `rbClassOf(obj)` (`packages/ruby-compat/src/object.ts`) answers the object's real class and `rbClassInheritedP(rbClassOf(obj), mod)` is false.

Consequence found on trails#8798: `vendor/msgpack/v1.8.0/spec/packer_spec.rb:473-490` ("when it has no ext type but it was extended by a module which has one") fails when ported with `extend({}, Mod)`. `Packer#extRegistryLookup` (`packages/msgpack/src/packer.ts`, `ext/msgpack/packer_ext_registry.h`) finds nothing and the object packs as an empty map (`0x80`) where the gem writes `"\xC7\x0F\x01value_msgpacked"`. The lookup itself is right: `include(rbObjSingletonClass(obj), Mod)` passes in `packer.trails.test.ts`.

## Acceptance criteria

- `extend(obj, mod)` on a non-class object includes the module into `rbObjSingletonClass(obj)`, so `rbClassOf(obj)` is the singleton class and `rbClassInheritedP(rbClassOf(obj), mod)` is true; `obj.constructor` still answers the real class.
- `packer_spec.rb:473-490` is ported in `packages/msgpack/src/packer.test.ts` under its gem name with `extend({}, Mod)` and passes (crediting it needs `ruby-test-extractor-skips-description-less-rspec-examples`).
- Existing `extend` callers on classes are unchanged; `packages/ruby-compat` and `packages/msgpack` tests pass.
