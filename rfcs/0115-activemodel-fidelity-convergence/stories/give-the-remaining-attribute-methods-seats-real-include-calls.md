---
title: "Give Read / Query / TimeZoneConversion / Serialization real include() calls at their attribute_methods.rb seats"
status: draft
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while closing `order-the-attribute-methods-includes-as-rails-does`
(PR #7157), which converged the *order* of the attribute-methods include spine
in `packages/activerecord/src/base.ts` but deliberately left the *membership*
alone (that story scoped itself to "the ordered spine, not relocating every
member").

`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:11-20`:

```ruby
included do
  initialize_generated_modules
  include Read
  include Write
  include BeforeTypeCast
  include Query
  include PrimaryKey
  include TimeZoneConversion
  include Dirty
  include Serialization
end
```

Eight includes. `base.ts`'s spine now has real `include(Base, …)` calls for
only four of them — Write, BeforeTypeCast, PrimaryKey (+ CompositePrimaryKey),
and both halves of Dirty. Read, Query and TimeZoneConversion currently hold
their Rails seat with an ordered comment only; their members reach `Base`
through the big prototype object literal further down the file (near the
`readStoreAttribute` / `isSavedChangeToAttribute` block), which is read **by
value** and therefore flattens accessor descriptors into data properties.

That is a real deviation: a member that arrives through the object literal is
not in the ancestry at the position Rails puts it, so later-include-wins cannot
resolve a collision the way Ruby does, and any zero-arg reader among those
three modules loses its accessor descriptor. The modules themselves already
exist — `packages/activerecord/src/attribute-methods/read.ts`, `query.ts`,
`time-zone-conversion.ts` — so no placeholder needs inventing.

Serialization is the fourth seat: `Serialization.serializableHash` and
`JSONSerializer` reach `Base` by their own routes, and it should be audited the
same way.

## Converged shape

Give Read, Query and TimeZoneConversion real `include(Base, …)` calls at their
attribute_methods.rb:13/16/18 seats, and drop the members they contribute from
the prototype object literal so nothing is wired twice. Audit Serialization
(:20) for the same treatment. Where a member genuinely must stay in the literal
(a name the literal deliberately overrides), say so at the call site with the
Rails line it corresponds to.

Watch the accessor-descriptor note already in the literal
(`primary_key_values_present?` / `ID_ATTRIBUTE_METHODS`, and the
`savedChanges` / `hasChangesToSave` / `changesToSave` /
`changedAttributeNamesToSave` / `attributesInDatabase` note): those comments
document exactly the flattening this story removes, and must be re-checked
after the move.

## Acceptance criteria

- [ ] `base.ts`'s attribute-methods spine has an `include(Base, …)` call at each
      of attribute_methods.rb:13-20's eight seats, or a call-site citation for
      any that genuinely cannot take one.
- [ ] No member is wired both by `include()` and by the prototype object
      literal.
- [ ] Every zero-arg reader among Read / Query / TimeZoneConversion arrives as
      an accessor property, not a flattened data property.
- [ ] activerecord suite green on all three adapter lanes; `pnpm parity:api:calls`
      / `:args` clean, `pnpm parity:api:extra:gate` marks narrow or hold.
