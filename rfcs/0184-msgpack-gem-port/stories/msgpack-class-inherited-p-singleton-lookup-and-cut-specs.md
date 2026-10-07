---
title: "msgpack: Module#<= and rb_class_of for the ext registry, -0.0, and the spec ports cut from the package PR"
status: in-progress
updated: 2026-10-07
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8647
claim: "2026-10-07T17:35:45Z"
assignee: "msgpack-bigint-ext-and-oversized-integer"
blocked-by: null
closed-reason: null
---

## Context

Review of trails PR 8591 (`msgpack-package-and-vendor-source`) left four items
that could not converge inside that PR.

**No `Module#<=` in ruby-compat.** `Packer#type_registered?`
(`vendor/msgpack/v1.8.0/lib/msgpack/packer.rb:27`) is
`klass <= entry[:class]`, and `msgpack_packer_ext_find_superclass`
(`vendor/msgpack/v1.8.0/ext/msgpack/packer_ext_registry.h:46-61`) is
`rb_class_inherited_p(lookup_class, key)`. ruby-compat exports no
`rb_class_inherited_p` (`vendor/ruby/v3.3.11/object.c:1778`); its
`classSearchAncestor` (`packages/ruby-compat/src/include.ts`) is module-private.
`packages/msgpack/src/packer.ts` stands in with
`klass === entry.class || rbObjIsKindOf(klass.prototype, entry.class)` and
`rbObjIsKindOf(instance, key)`. The first is wrong for a base class whose
prototype's parent is `Object.prototype`: `rbObjClass` reads that prototype as a
plain `Hash`, so a Module the class includes is not found.

**No `rb_class_of`.** `msgpack_packer_ext_registry_lookup`
(`packer_ext_registry.h:102-118`) looks the singleton class up first, then the
real class. `rbObjSingletonClass` creates a singleton class on first call, so
there is no way to ask whether an object already has one; `extRegistryLookup`
does one lookup on `rbObjClass`.

**`-0.0`.** A whole-number Float packs as an Integer unless it is the boxed
`Number` ruby-compat's `rbObjClass` reads as Float; `-0` is
`Number.isInteger`, so it packs as `00` where the gem packs
`cb8000000000000000`.

**Spec ports cut for size.** Seven ported tests were removed from PR 8591 to
stay under the LOC ceiling after review added source: `packer_spec.rb`
`write_array_header 0` / `1`, `write_map_header 0` / `1`, `#type_registered?`
"receive Class or Integer, and return bool", `#register_type` "returns a Hash
which contains map of Class and type"; `unpacker_spec.rb` `#type_registered?`
"receive Class or Integer, and return bool" and "with ext definitions"
"returns a Array of Hash which contains :type, :class and :unpacker".
`Buffer#to_s` (`buffer_class.c`'s alias of `to_str`) is unported too.

## Acceptance criteria

- ruby-compat gains `rbClassInheritedP` with its `@noRailsEquivalent PERMANENT`
  receipt, and `packer.ts` (and `factory.ts`, if landed) uses it at both sites.
- The singleton-class lookup step is ported, or blocked on a ruby-compat
  `rb_class_of` with the reason.
- `-0` packs as the gem packs it, or the limit is recorded where Float carriers
  are decided.
- The seven spec tests are back under their gem names, and `Buffer#toS` exists.
