---
title: "AR instance_method_already_implemented? collapses the superclass/GeneratedAttributeMethods branch into a prototype probe"
status: done
updated: 2026-08-18
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: 6720
claim: "2026-08-18T20:31:56Z"
assignee: "wave-4c-ar-core-residue-attributes"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6711 (`instance-method-already-implemented-ar-override`), which
reduced `defineAttributeMethodPattern`'s guard to the single template-method
call Rails makes (`activemodel/lib/active_model/attribute_methods.rb:326`). The
AR override itself was left as it stood, and it collapses two Rails branches
into one probe.

Rails (`activerecord/lib/active_record/attribute_methods.rb:165-179`):

```ruby
def instance_method_already_implemented?(method_name)
  if dangerous_attribute_method?(method_name)
    raise DangerousAttributeError, "..."
  end

  if superclass == Base
    super
  else
    # If ThisClass < ... < SomeSuperClass < ... < Base and SomeSuperClass
    # defines its own attribute method, then we don't want to override that.
    defined = method_defined_within?(method_name, superclass, Base) &&
      ! superclass.instance_method(method_name).owner.is_a?(GeneratedAttributeMethods)
    defined || super
  end
end
```

trails (`packages/activerecord/src/attribute-methods.ts`):

```ts
if (isDangerousAttributeMethod.call(this, methodName)) { throw ... }
return methodName in this.prototype;
```

The existing JSDoc says the `superclass == Base` split "reduces to the prototype
probe here", because the generated module is spliced into the prototype chain.
That is true for _presence_, but it drops the `! owner.is_a?(GeneratedAttributeMethods)`
exclusion, which is the whole point of the branch: an inherited **generated**
attribute method must NOT count as already-implemented, so a subclass still
generates its own. A hand-written method on an ancestor must. trails cannot tell
them apart with `in`, so an inherited generated accessor currently suppresses
generation on the subclass.

`isMethodDefinedWithin` is already ported under the Rails name and is currently
unused by this predicate — it is the half of the branch that exists.

## Converged shape

- Restore both arms: `superclass === Base` takes the ActiveModel `super`
  (`generatedAttributeMethods.isMethodDefined`); otherwise
  `isMethodDefinedWithin(methodName, superclass, Base)` AND an owner check that
  excludes the generated-attribute-methods module, `|| super`.
- The owner check needs a way to ask which prototype in the chain owns a name
  and whether it is a generated module. `generatedAttributeMethods` already
  returns a `Module`, so walking `Object.getPrototypeOf` and comparing against
  the ancestors' generated modules is the likely shape — no new public surface.

## Acceptance criteria

- [ ] Both Rails branches are present, with `isMethodDefinedWithin` used.
- [ ] A test covers an inherited GENERATED attribute method NOT suppressing the
      subclass's own generation, and an inherited hand-written method DOING so.
      Both must fail on the pre-change baseline.
- [ ] `parity:api:extra --package activerecord` gains no novel name.
- [ ] `parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
      non-negative.
