---
title: "Resolve has_attribute? through attribute_aliases, not resolve_attribute_name"
status: done
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
- [x] A test covers `hasAttribute` on an aliased attribute at BOTH levels —
      `attribute-methods.trails.test.ts`'s
      `returns true for alias_attribute names on instances` (pre-existing) and
      `... on the class` (added in trails#6818) — plus Rails' own
      `has attribute` / `has attribute with symbol`
      (`vendor/rails/activerecord/test/cases/base_test.rb:1600-1631`, which
      asserts on Company's `new_name` alias).
      **The "fails on the pre-fix baseline" half is struck as misspecified.**
      The Context above asserts `resolveAttributeName` is
      `AttributeRegistration::ClassMethods#resolve_attribute_name`
      (`attribute_registration.rb:101-103`, `name.to_s`, identity in trails).
      It is not: trails' single `resolveAttributeName` is the
      `AttributeMethods::ClassMethods` override
      (`attribute_methods.rb:394-396`, `attribute_aliases.fetch(super, &:itself)`),
      which already resolves aliases. Verified on the pre-fix baseline —
      `Topic.hasAttribute("heading")` and `topic.hasAttribute("heading")` both
      returned `true`. So there was no behavioural bug and no test can fail on
      the baseline; this story is a pure fidelity convergence of the body onto
      `attribute_aliases[attr_name] || attr_name`.

- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows.
