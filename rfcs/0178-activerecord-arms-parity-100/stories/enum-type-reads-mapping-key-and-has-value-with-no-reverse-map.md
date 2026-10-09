---
title: "activerecord: EnumType reads mapping.key / has_value? with no reverse map"
status: claimed
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-10-09T19:39:37Z"
assignee: "attribute-methods-initialize-generated-modules-deferral-guards"
blocked-by: null
closed-reason: null
---

## Context

`EnumType` (`packages/activerecord/src/enum.ts`) builds a `_reverseMapping` `Map` in its constructor and reads it in
`cast`, `deserialize` and `assertValidValue`. Rails keeps no second structure: `cast` is
`mapping.has_value?(value)` then `mapping.key(value)`, `deserialize` is `mapping.key(subtype.deserialize(value))`,
and `assert_valid_value` is `mapping.has_value?(value)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/enum.rb:171-203`). Its `initialize` assigns four ivars and
nothing else (`:171-176`).

The field is a snapshot taken at construction, so it also blocks
`enum-private-enum-body-is-a-line-for-line-port`: Rails hands `EnumType.new` the `enum_values` hash BEFORE the
loop fills it (`enum.rb:247` against `:262-263`), and a snapshot of an empty hash answers nothing.

ruby-compat has no port of `Hash#key` (`vendor/ruby/v3.3.11/hash.c` `rb_hash_key`) or `Hash#has_value?`
(`rb_hash_has_value`), and `HashWithIndifferentAccess#key` (`activesupport/src/hash-with-indifferent-access.ts:125`)
is currently spelled as the `key?` predicate, which is a second deviation: Rails' HWIA aliases `key?`, `include?`,
`has_key?` and `member?` and leaves `Hash#key` as the reverse lookup.

## Acceptance criteria

- [ ] ruby-compat ports `Hash#key` and `Hash#has_value?` / `value?`, comparing with `rbEqual` as `rb_hash_key` and
      `rb_hash_has_value` do, each with its MRI citation.
- [ ] `HashWithIndifferentAccess#key` is the reverse lookup, and its present callers move to `hasKey`.
- [ ] `EnumType` has no `_reverseMapping`; `cast`, `deserialize` and `assertValidValue` call `mapping.hasValue` /
      `mapping.key` as `enum.rb:178-203` does, and the constructor is the four assignments of `:171-176`.
- [ ] `enum.test.ts` and `enum.trails.test.ts` pass.
