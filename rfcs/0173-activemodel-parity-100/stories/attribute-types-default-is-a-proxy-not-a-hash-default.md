---
title: "activemodel: attribute_types seats hash.default in a Proxy; hashAref re-reads the object to find it"
status: draft
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `attribute_types`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_registration.rb:37-41`) is
`_default_attributes.cast_types.tap { |hash| hash.default = Type.default_value }`: a Hash with a
default value. trails' `attributeTypes` (`packages/activemodel/src/attribute-registration.ts`,
`ClassMethods.attributeTypes`) seats that default in a `new Proxy(cast, { get })` trap over a
plain object, which no hash helper can see.

trails PR 8456 hit this: `LazyAttributeSet` reads `types[name]`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:47-48,78`) through
`hashAref`, whose own-key check skipped the Proxy's default and gave every selected alias a nil
type. The PR worked around it in `hashAref` (`packages/ruby-compat/src/hash.ts`): a miss on a
plain or null-prototype object re-reads the object and treats any value that is not the inherited
`Object.prototype` member as the hash's default. That arm exists only to serve this Proxy, and a
default equal to the `Object.prototype` member would read as nil.

## Converged shape

`attributeTypes` carries its default in a seat ruby-compat's Hash functions read
(`rb_hash_default_value`, `vendor/ruby/v3.3.11/hash.c:2068`; `Hash#default=`), either a
ruby-compat `Hash` with `setDefault(Type.defaultValue())` or a default seat on the plain-object
hash that `hashAref` and `Hash#default` both read. The Proxy and `hashAref`'s re-read arm are
deleted.

## Acceptance criteria

- [ ] `attributeTypes` sets its default with a `hash.default =` port, with no `Proxy`.
- [ ] `hashAref`'s miss arm reads the default seat and no longer re-reads the object or compares
      against `Object.prototype`.
- [ ] `packages/activemodel/src/attribute-set/builder.trails.test.ts` and the Active Record
      select-alias tests (`packages/activerecord/src/select-alias-reader.trails.test.ts`,
      `relations.test.ts` "joins with select") stay green.
