---
title: "activerecord: habtm through_model's left association takes no foreign key"
status: draft
updated: 2026-10-04
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
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

Raised in review of trails#8488. Rails' `Builder::HasAndBelongsToMany#through_model`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/builder/has_and_belongs_to_many.rb:54`)
adds the join model's left association with no foreign key:

```ruby
join_model.add_left_association :left_side, anonymous_class: lhs_model
```

and applies the habtm `:foreign_key` option to the middle reflection only (`middle_options`, `:71-77`).

trails (`packages/activerecord/src/associations/builder/has-and-belongs-to-many.ts`, `throughModel`)
passes an explicit key to the left association:

```ts
joinModel.addLeftAssociation("leftSide", {
  anonymousClass: lhsModel,
  foreignKey: this.options.foreignKey ?? `${underscore(demodulize(rbModName(lhsModel)!))}_id`,
});
```

and then assigns `joinModel.primaryKey = [leftReflection.foreignKey(), rightReflection.foreignKey()]`,
a line Rails does not have. So a custom `foreignKey` changes the join model's left reflection and
primary key in the port.

Dropping the option alone is not enough. Tried on trails#8488: the left reflection then derives
`left_side_id`, and `destroying`, `destroying many` and `destroy all` in
`has-and-belongs-to-many-associations.test.ts` fail with
`no such column: developers_projects.left_side_id`, because the delete path reads the join model's
invented primary key.

## Acceptance criteria

- [ ] `throughModel` calls `addLeftAssociation("leftSide", { anonymousClass: lhsModel })`, as `has_and_belongs_to_many.rb:54` does.
- [ ] The join model's `primaryKey` assignment is removed, or replaced by whatever Rails' delete path reads for a join model with no primary key.
- [ ] `packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts` stays green, including the three destroy tests.
