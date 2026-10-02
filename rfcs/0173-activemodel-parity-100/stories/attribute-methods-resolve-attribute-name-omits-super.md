---
title: "activemodel: AttributeMethods resolve_attribute_name fetches on super (name.to_s)"
status: done
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8409
claim: "2026-10-02T16:41:58Z"
assignee: "arel-attribute-and-sql-literal-are-not-nodes"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:396-398` is

```ruby
def resolve_attribute_name(name)
  attribute_aliases.fetch(super, &:itself)
end
```

and `super` is `AttributeRegistration::ClassMethods#resolve_attribute_name`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_registration.rb:101-103`), `name.to_s`.

`packages/activemodel/src/attribute-methods.ts` `ClassMethods.resolveAttributeName` (converged onto
`fetch(this.attributeAliases, name, block(...))` by trails#8324) passes `name` straight to `fetch` and never
reaches the `AttributeRegistration` body (`packages/activemodel/src/attribute-registration.ts`
`resolveAttributeName`, which returns `name` without the `to_s`). `super` is excluded from the call gate, so
no baseline row records this.

## Acceptance criteria

- [ ] `AttributeMethods::ClassMethods#resolveAttributeName` fetches on the result of the `AttributeRegistration` body, reached the way the file's other module `super` calls are.
- [ ] `AttributeRegistration`'s body is `name.to_s` (a Symbol-or-String name resolves to the same key).
- [ ] activemodel + activerecord attribute-method and alias tests green.
