---
title: "activemodel: Attributes' alias_attribute_method_definition override has no Rails site and no receipt form"
status: done
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8451
claim: "2026-10-03T17:51:44Z"
assignee: "activemodel-attributes-alias-attribute-method-definition-override-has-no-rails-site"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8443. `packages/activemodel/src/attributes.ts` exports `aliasAttributeMethodDefinition`, which `Attributes[included]` extends onto the base beside `defineMethodAttribute`. Its body is ActiveRecord's override (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:87-96`, minus the `has_attribute?` guard):

```ts
this.defineAttributeMethodPattern(pattern, oldName, {
  owner: codeGenerator,
  as: newName,
  override: true,
});
```

`ActiveModel::Attributes` defines no such method (`vendor/rails/v8.0.2/activemodel/lib/active_model/attributes.rb`); Rails' ActiveModel alias goes through `alias_attribute_method_definition` -> `define_call` (`attribute_methods.rb:226-237`). trails needs the override because an ActiveModel reader is an accessor property (CLAUDE.md § "Generated attribute readers are properties"), and `define_call` would emit the alias as a method.

The deviation carries no receipt, and cannot today:

- `no-freeform-comments` strips a prose citation.
- `@noRailsEquivalent PERMANENT` is rejected by `pnpm parity:api:extra --package activemodel` as a REDUNDANT tag: the scorer credits the name to Rails' method because `Attributes` includes `AttributeMethods` (`attributes.rb:8`).
- `@internal` alone is rejected by `blazetrails/unbacked-internal-needs-receipt`.

So a member defined in a file whose `.rb` does not define it passes the rowless `extra:gate` untagged.

## Acceptance criteria

- [ ] Converge: `defineCall` (`attribute-methods.ts`) emits an alias of a property-shaped target as a property, so `aliasAttributeMethodDefinition` in `attribute-methods.ts` (already line for line with `:226-237`) serves ActiveModel and the `attributes.ts` override is deleted.
- [ ] If the override must stay, the extra-surface scorer stops crediting a file-level function to a method its own `.rb` does not define merely because an included module does, so the member takes a `@noRailsEquivalent PERMANENT` receipt against the CLAUDE.md section. Add a scorer test for that case.
- [ ] `pnpm parity:api:extra:gate` stays rowless for activemodel.

## Verification

```bash
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:extra:gate && pnpm parity:api:extra --package activemodel && pnpm vitest run packages/activemodel/src/attribute-methods.test.ts packages/activemodel/src/attributes.test.ts
```
