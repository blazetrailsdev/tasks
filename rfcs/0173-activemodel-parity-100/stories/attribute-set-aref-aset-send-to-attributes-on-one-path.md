---
title: "activemodel: AttributeSet sends [] / []= / transform_values / each_value / except to @attributes on one path"
status: ready
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set.rb:17,21` sends `[]` and `[]=` to
`@attributes`, a Hash or a `LazyAttributeHash`. `packages/activemodel/src/attribute-set.ts` still
routes both through the module helpers `aref` / `aset`, which branch on `isPlainObject(attributes)`
and call `attributes.getAttribute(name)` / `attributes.set(name, value)` for the lazy hash.

The sibling story `attribute-set-sends-to-attributes-hash-or-lazy-hash-on-one-path` moved `key?` /
`each_key` / `fetch` onto ruby-compat's `hasKey` / `eachKey` / `fetch`, which reach a non-Hash
receiver's own method through `ownMethod` (`packages/ruby-compat/src/hash.ts:41-47`). `hashAref` /
`hashAset` (`hash.ts:312-332`) have no such dispatch, and `LazyAttributeHash`
(`packages/activemodel/src/attribute-set/builder.ts`) spells `[]` / `[]=` as `getAttribute` / `set`,
so there is no receiver method for them to reach. That is the blocker the sibling story's second
acceptance criterion names.

`transform_values`, `each_value`, `except` and `reverse_merge!` (`attribute_set.rb:25-37,49,96`)
branch on `isPlainObject` the same way and want the same dispatch.

## Acceptance criteria

- [ ] `hashAref` / `hashAset` reach a non-Hash receiver's own `[]` / `[]=` (`rb_hash_aref`,
      `vendor/ruby/v3.3.11/hash.c:2094`; `rb_hash_aset`, `hash.c:2936`), and `LazyAttributeHash`
      answers under the names they dispatch to.
- [ ] `AttributeSet`'s bodies call `hashAref` / `hashAset` on `this._attributes`, and the `aref` /
      `aset` helpers are deleted.
- [ ] `transformValues`, `eachValue`, `except` and `reverseMergeBang` send to `this.attributes()`
      on one path, with no `isPlainObject` branch.
- [ ] `builder-defaults.trails.test.ts` and `attribute-set*.test.ts` pass unchanged.
