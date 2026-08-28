---
title: "Install ActiveRecord's reset_default_attributes override on Base and chain reload_schema_from_cache"
status: claimed
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-08-28T16:04:58Z"
assignee: "converge-activemodel-callbacks-extended-hook-to-append-features-order"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Attributes::ClassMethods` overrides AttributeRegistration's
private `reset_default_attributes`
(`vendor/rails/activerecord/lib/active_record/attributes.rb:293-295`):

```ruby
def reset_default_attributes
  reload_schema_from_cache
end
```

so on an AR class the reset routes through
`reload_schema_from_cache` (`attributes.rb:268-271` → `super` →
`model_schema.rb:553-571`), which also nils `arel_table`, `column_names`,
`columns_hash` and does its own descendant recursion.

trails has the body — `resetDefaultAttributes` in
`packages/activerecord/src/attributes.ts:129-131` — but it is neither exported
nor installed on `Base`, so it is dead code: nothing calls it, and AR classes
answer `resetDefaultAttributes` with ActiveModel's version
(`packages/activemodel/src/attribute-registration.ts`), which only calls
`resetDefaultAttributesBang` and recurses through `DescendantsTracker`. PR #7142
put that AM method on `ClassMethods` and made its subclass recursion dispatch
virtually (`sub.resetDefaultAttributes()`), so the override is now installable
and would take effect on descendants too.

Its callee `reloadSchemaFromCache` (`activerecord/src/attributes.ts:98-100`) is
likewise a trails-local stub that calls AM's recursive
`resetDefaultAttributes`, where Rails calls the BANG
(`reset_default_attributes!`, attributes.rb:269) and then `super` into
`model-schema.ts`'s `reloadSchemaFromCache`.

## Converged shape

- `activerecord/src/attributes.ts`'s `reloadSchemaFromCache` calls
  `resetDefaultAttributesBang` and then chains to `model-schema.ts`'s
  `reloadSchemaFromCache` (Rails' `super`), matching attributes.rb:268-271.
- `resetDefaultAttributes` is exported and installed on `Base` alongside the
  other `AttributesClassMethods` members, so it overrides the ActiveModel one
  the way `attributes.rb:293-295` does.

Interacts with the blocked
`converge-default-attributes-reset-points-onto-rails` (which owns WHERE the
memo is dropped); this story owns WHAT an AR reset does when it happens.

## Acceptance criteria

- [ ] No dead unexported `resetDefaultAttributes` in
      `packages/activerecord/src/attributes.ts`; the override is installed on
      `Base`.
- [ ] `reloadSchemaFromCache` there mirrors attributes.rb:268-271 (bang + the
      `super` chain into model-schema).
- [ ] AR suites green on all three lanes; `pnpm parity:api:calls` / `:args` add
      zero rows; parity deltas non-negative.
