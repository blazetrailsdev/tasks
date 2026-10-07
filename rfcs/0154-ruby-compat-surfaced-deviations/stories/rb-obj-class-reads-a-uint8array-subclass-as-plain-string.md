---
title: "rbObjClass answers String for a Uint8Array subclass, so a String-subclass ext type is never found"
status: done
updated: 2026-10-07
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8647
claim: "2026-10-07T18:03:39Z"
assignee: "rb-obj-class-reads-a-uint8array-subclass-as-plain-string"
blocked-by: null
closed-reason: null
---

## Context

`rbObjClass` (`packages/ruby-compat/src/object.ts`) answers `rbCString` for
any `obj instanceof Uint8Array`, so an instance of
`class Foo extends Uint8Array` reads as a plain String. In Ruby a String
subclass is its own class: `rb_class_of(Class.new(String).new)` is that
subclass (`vendor/ruby/v3.3.11/include/ruby/internal/globals.h:172`).

Found in review of trails PR 8647. `msgpack_packer_write_value`
(`vendor/msgpack/v1.8.0/ext/msgpack/packer.c:174-178`) sends a String whose
`rb_class_of` is not `rb_cString` through the ext lookup, and
`msgpack_packer_ext_registry_lookup`
(`ext/msgpack/packer_ext_registry.h:102-118`) keys that lookup on the same
class. In `packages/msgpack/src/packer.ts` both read `rbClassOf` /
`rbObjClass`, which answer `rbCString`, so an ext type registered on a
`Uint8Array` subclass is never found and the value packs as `bin`. This
predates PR 8647: `extRegistryLookup` keyed on `rbObjClass` before it, so the
lookup missed even when the arm's `v.constructor === Uint8Array` test let the
value through.

Node's `Buffer` is a `Uint8Array` subclass, and reads as a String today.
Whatever `rbObjClass` answers for a subclass has to keep `rbObjIsKindOf(buf,
rbCString)` true.

## Acceptance criteria

- `rbObjClass` answers the constructor for an instance of a `Uint8Array`
  subclass, and that class has `rbCString` in its ancestry for
  `rbObjIsKindOf` and `rbClassInheritedP`; or the story is blocked with the
  reason a subclass cannot be told from the binary String seat.
- A packer test registers an ext type on `class Foo extends Uint8Array` and
  packs an instance through it, as `packer_spec.rb`'s "extension subclasses
  core type" shared example does for Hash and Array.
- A Node `Buffer` still packs as `bin` with no ext type registered.
