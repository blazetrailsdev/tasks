---
title: 'ruby-compat: Marshal reads a plain-object Hash''s class from its "constructor" key'
status: draft
updated: 2026-10-12
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`w_uclass` (`vendor/ruby/v3.3.11/marshal.c:590`) reads the class of the object
being dumped (`rb_obj_class`) and writes `TYPE_UCLASS` when it is not the base
class. The port, `wUclass` in `packages/ruby-compat/src/marshal.ts`, reads it
as `obj.constructor`. For a Ruby Hash that trails holds as a plain object, that
is a property read on the Hash's own keys:

- `Marshal.dump({ constructor: 1 })` raises `TypeError: Invalid value used as
weak map key`, where MRI 3.3.11 dumps `Marshal.dump({"constructor"=>1})` as
  `"\x04\b{\x06I\"\x10constructor\x06:\x06ETi\x06"`.
- A Proxy that answers every missed key answers `constructor` too.
  `attributeTypes` (`packages/activemodel/src/attribute-registration.ts`), the
  stand-in for `Hash.new(Type.default_value)`, hands back a type, and the dump
  of any record under format 6.1 raises `can't dump anonymous module` from
  `@_attributes.@types`. Seen on trails#8815; this is one of the blockers of
  `activerecord-record-round-trips-marshal-6-1-format`.

`wClass` and `rbObjClassname` reach the class the same way; `isPlainHash`
(`packages/ruby-compat/src/object.ts`) already reads the prototype's own
`constructor` descriptor rather than the property.

## Acceptance criteria

- [ ] `wUclass` reads the object's class from its prototype chain, never from a
      key of the Hash, so `Marshal.dump({ constructor: 1 })` writes MRI's bytes.
      A row in `marshal.fixtures.rb` covers it, with the load direction.
- [ ] A plain-object Hash behind a Proxy that answers missed keys dumps as a
      Hash, covered in `packages/ruby-compat/src/marshal.trails.test.ts`.
