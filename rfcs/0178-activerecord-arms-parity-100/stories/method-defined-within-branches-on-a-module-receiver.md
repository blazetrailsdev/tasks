---
title: "activerecord: method_defined_within? branches on a Module receiver Rails does not"
status: done
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8759
claim: "2026-10-10T16:39:42Z"
assignee: "base-load-schema-primary-key-warm-arm-moves-to-primary-key-resolution"
blocked-by: null
closed-reason: null
---

## Context

Left by the PR that ported `Enum#_enum` line for line (story `enum-private-enum-body-is-a-line-for-line-port`).

Rails' `detect_enum_conflict!` fifth arm
(`vendor/rails/v8.0.2/activerecord/lib/active_record/enum.rb:378-379`) calls
`method_defined_within?(method_name, _enum_methods_module, Module)`, handing
`method_defined_within?` (`activerecord/lib/active_record/attribute_methods.rb:185-195`) a Module
instance where every other caller hands it a class. Its first test is
`klass.method_defined?(name) || klass.private_method_defined?(name)`.

The port (`packages/activerecord/src/attribute-methods.ts`, `isMethodDefinedWithin`) spells that test
`name in klass.prototype`, which a ruby-compat `Module` instance cannot answer (its method table is
the private carrier, `packages/ruby-compat/src/include.ts` `carrierOf`). So the body now opens with
`klass instanceof Module ? klass.isMethodDefined(name) : name in klass.prototype`, an arm Rails
does not have, receipted `@inventedArm if — CONVERGEABLE` against this story.
`pnpm parity:api:arms:report --package=activerecord --direction=invented` shows it as
`attribute-methods.ts#isMethodDefinedWithin  +if`.

`rbModMethodDefined` (`packages/ruby-compat/src/object.ts:622`) is `Module#method_defined?` for a
`{ prototype }` receiver only.

## Acceptance criteria

- [ ] One `Module#method_defined?` spelling answers for a class and for a ruby-compat `Module`
      instance, and `isMethodDefinedWithin` makes Rails' two calls on `klass` and `superklass`
      with no receiver-kind arm.
- [ ] The `@inventedArm if` receipt on `isMethodDefinedWithin` is deleted and the arms report shows
      no row for it.
- [ ] `enum.test.ts`, `enum.trails.test.ts` and `attribute-methods.test.ts` pass.
