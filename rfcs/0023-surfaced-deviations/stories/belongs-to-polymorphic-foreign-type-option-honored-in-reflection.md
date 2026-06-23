---
title: "Honor options[:foreign_type] for polymorphic belongs_to in reflection foreignType"
status: claimed
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-06-23T11:32:39Z"
assignee: "belongs-to-polymorphic-foreign-type-option-honored-in-reflection"
blocked-by: null
---

## Context

Surfaced reviewing PR #3968 (as-foreign-type-option-honored-in-reflection-type),
which fixed the `as:` branch of `AssociationReflection#foreignType`.

Rails keeps `@type` and `@foreign_type` as two separate attributes
(`vendor/rails/activerecord/lib/active_record/reflection.rb:519-520`):

```ruby
@type = -(options[:foreign_type]&.to_s || "#{options[:as]}_type") if options[:as]
@foreign_type = -(options[:foreign_type]&.to_s || "#{name}_type") if options[:polymorphic]
```

trails collapses both into the single `foreignType` getter
(reflection.ts:872). The `as:` branch now honors `options.foreignType`
(PR #3968), but the **polymorphic belongsTo branch still hard-builds
`${name}_type`**, ignoring an explicit `foreign_type:`:

```ts
if (this.belongsTo()) return `${underscore(this.name)}_type`;
```

So `belongs_to :imageable, polymorphic: true, foreign_type: "imageable_kind"`
diverges: trails' reflection emits `imageable_type`, Rails emits the declared
`imageable_kind`. Note `belongsTo` builder validates `foreignType` as a legal
option (builder/belongs-to.ts:30) and the association layer honors it
(belongs-to-polymorphic-association.ts:165, builder/belongs-to.ts:186), so the
reflection getter is the lone holdout — uniqueness validation
(validations/uniqueness.ts:277) and any consumer of `reflection.foreignType`
read the wrong column.

Latent: no canonical fixture declares `foreign_type:` on a polymorphic
`belongs_to`, but it is a real Rails deviation.

## Acceptance criteria

- [ ] `foreignType` honors `options.foreignType` for the polymorphic
      belongsTo branch, mirroring reflection.rb:520:
      `options[:foreign_type] || "#{name}_type"`.
- [ ] Add coverage for a polymorphic `belongs_to` declared with an explicit
      `foreign_type:` (reflection getter + the uniqueness-validation read path).
