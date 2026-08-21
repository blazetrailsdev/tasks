---
title: "Resolve has_attribute? through attribute_aliases, not resolve_attribute_name"
status: in-progress
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6818
claim: "2026-08-21T13:20:34Z"
assignee: "move-collection-proxy-transaction-and-clone-to-their-rails-seats"
blocked-by: null
closed-reason: null
---

## Context

Rails resolves `has_attribute?` through `attribute_aliases`, not through
`resolve_attribute_name`
(`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:316-320`):

```ruby
def has_attribute?(attr_name)
  attr_name = attr_name.to_s
  attr_name = self.class.attribute_aliases[attr_name] || attr_name
  @attributes.key?(attr_name)
end
```

The class-level twin does the same against `attribute_types`
(`attribute_methods.rb:254-258`).

Two trails ports substitute `resolveAttributeName` for the alias lookup:

- `packages/activemodel/src/model.ts` — `Model#hasAttribute`
- `packages/activerecord/src/attribute-methods.ts:92-100` — the AR override,
  which even carries the Rails line as a comment while not doing what it says

`resolveAttributeName` is `ActiveModel::AttributeRegistration::ClassMethods#resolve_attribute_name`
(`activemodel/lib/active_model/attribute_registration.rb`), which is `name.to_s`
— identity in trails. So `hasAttribute("aliasName")` returns false where Rails
returns true.

Surfaced while converging the AM `_attributeDefinitions` readers (#6804): the
body was re-pointed at the attribute set (`isKey`, Rails' `key?`) but the alias
arm was left as-is to keep that PR to its slice.

## Converged shape

```ts
hasAttribute(name: string): boolean {
  const klass = this.constructor as typeof Model;
  return this._attributes.isKey(klass.attributeAliases[name] ?? name);
}
```

Same for the AR override, whose comment already describes this shape. Check the
class-level `hasAttribute` (`packages/activerecord/src/base.ts:4350`) against
`attribute_methods.rb:254-258` in the same pass.

## Acceptance criteria

- [ ] Both `hasAttribute` bodies resolve through `attributeAliases`, mirroring
      `attribute_methods.rb:316-320` / `:254-258`.
- [ ] A test covers `hasAttribute` on an aliased attribute (Rails'
      `AttributeMethodsTest` alias coverage in
      `vendor/rails/activerecord/test/cases/attribute_methods_test.rb`) and
      fails on the pre-fix baseline.
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows.
