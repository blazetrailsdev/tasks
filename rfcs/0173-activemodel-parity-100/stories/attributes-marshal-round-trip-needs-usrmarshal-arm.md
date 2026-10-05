---
title: "activemodel: port 'attributes with proc defaults can be marshalled' once Marshal has the marshal_dump / TYPE_USRMARSHAL arm"
status: draft
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps:
  - ruby-compat-has-no-marshal-for-schema-cache-and-debug
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

The remaining third of `activemodel-port-marshal-and-yaml-error-tests`.
`test "attributes with proc defaults can be marshalled"`
(`vendor/rails/v8.0.2/activemodel/test/cases/attributes_test.rb:136-143`) is still parked in
`packages/activemodel/src/attributes.test.ts` with a row in
`scripts/parity/unported-files/unscoped.ts`.

Tried with Rails' body over ruby-compat's `Marshal.load(Marshal.dump(data))`. Two findings:

- The class must be seated before the dump, or `class2path` raises
  `undefined class/module ModelForAttributesTest`. Rails nests it as
  `ActiveModel::AttributesTest::ModelForAttributesTest` (`attributes_test.rb:5-7`). Verified
  seating, the shape `errors.test.ts` uses for `ErrorsTest::Person`:
  `const AttributesTest = new Module(); registerConstant("ActiveModel::AttributesTest", AttributesTest)`
  and `rbModConstSet(AttributesTest, "ModelForAttributesTest", this)` first in the class's
  `static {}`. The other 12 tests in the file stay green with it.
- With that, the dump raises `TypeError: no _dump_data is defined for class Proc`. The
  `date_field` default is a `UserProvidedDefault` holding the proc, which Ruby dumps through
  `marshal_dump` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute/user_provided_default.rb:29-38`)
  and reloads through `marshal_load` (`:40-49`). ruby-compat's `Marshal` has no `marshal_dump`
  arm (`vendor/ruby/v3.3.11/marshal.c:910`) and no `TYPE_USRMARSHAL` load arm; both are
  `ruby-compat-has-no-marshal-for-schema-cache-and-debug`.

Also check when porting: `UserProvidedDefault.marshalLoad`
(`packages/activemodel/src/attribute/user-provided-default.ts:40-52`) is a `static` that
constructs a new instance, where Rails' `marshal_load` is an instance method assigning ivars
on the allocated object. `r_object`'s `TYPE_USRMARSHAL` arm allocates and then calls the
instance method, so it has to converge to the instance shape to be driven by `Marshal.load`.

## Acceptance criteria

- [ ] `attributes with proc defaults can be marshalled` runs un-skipped with Rails' body
      (`instance_variable_get(:@attributes)` on both sides, one `assert_equal`), through
      ruby-compat's `Marshal`.
- [ ] `UserProvidedDefault#marshalLoad` is an instance method mirroring
      `user_provided_default.rb:40-49`.
- [ ] The `attributes_test.rb` row in `scripts/parity/unported-files/unscoped.ts` is deleted.

## Verification

```bash
pnpm vitest run packages/activemodel/src/attributes.test.ts
pnpm parity:test --package activemodel --missing
```
