---
title: "activerecord: ForeignAssociation is a module of instance methods, not a class with a static"
status: draft
updated: 2026-10-01
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-associations` audit (trails#8328).

Rails' `ForeignAssociation` is a module of three instance methods
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/foreign_association.rb:3-38`), mixed in
with `include ForeignAssociation` by `HasManyAssociation` (`has_many_association.rb:12`) and
`HasOneAssociation` (`has_one_association.rb:7`):

```ruby
def nullified_owner_attributes
  Hash.new.tap do |attrs|
    Array(reflection.foreign_key).each { |foreign_key| attrs[foreign_key] = nil }
    attrs[reflection.type] = nil if reflection.type.present?
  end
end
```

`packages/activerecord/src/associations/foreign-association.ts` ports it as three different shapes:

- `foreignKeyPresent` is a `this`-typed function (the settled mixin idiom).
- `ForeignAssociation` is a CLASS carrying a placeholder field `foreignKeyPresent: boolean = false` and a
  STATIC `nullifiedOwnerAttributes(reflection)` that takes the reflection as a parameter where Rails
  reads `reflection` off `self`.
- `has-one-association.ts` and `has-many-association.ts` each wrap that static in a module-private
  `nullifiedOwnerAttributes(assoc)` function, so the method a Rails dev looks for on the association
  does not exist there.
- `attrs[reflection.type] = nil if reflection.type.present?` is ported `if (reflection.type)` — JS
  truthiness, where `present?` is ActiveSupport's (`" "` is blank and truthy).

`nullified-owner-attributes-fk-ladder-single-site` (RFC 0023) removes the FK ladder inside the two
wrappers but explicitly keeps the static's signature, and
`converge-set-owner-attributes-to-foreign-association` owns `set_owner_attributes`; neither converges
the module's shape. The static's `@missingRailsCall new` receipt belongs to
`call-gate-credits-argumentless-hash-new-as-a-literal`.

## Acceptance criteria

- [ ] `ForeignAssociation` is a ruby-compat `Module` (or the `this`-typed-function mixin) whose members are `foreignKeyPresent`, `nullifiedOwnerAttributes` and `setOwnerAttributes`, each reading `this.reflection` / `this.owner`, mixed in with `include(HasManyAssociation, ForeignAssociation)` / `include(HasOneAssociation, ForeignAssociation)` — the shape `ThroughAssociation` already has.
- [ ] The class, its placeholder field, the static, and the two module-private `nullifiedOwnerAttributes(assoc)` wrappers are deleted; call sites are `this.nullifiedOwnerAttributes()`.
- [ ] `reflection.type.present?` is `isPresent(this.reflection.type)`.
- [ ] `pnpm parity:api`, `:calls`, `:calls:args` and `:extra:gate` green with no new baseline row; `dependent: :nullify` tests for has_one, has_many and polymorphic owners pass.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:extra:gate && pnpm vitest run packages/activerecord/src/associations/has-many-associations.test.ts packages/activerecord/src/associations/has-one-associations.test.ts -t "nullify"
```
