---
title: "Honor options[:foreign_type] for as: associations in foreignType/type"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3968
claim: "2026-06-23T10:57:39Z"
assignee: "as-foreign-type-option-honored-in-reflection-type"
blocked-by: null
---

## Context

Surfaced reviewing PR #3865 (through-polymorphic-source-applies-type-condition).

trails' `AssociationReflection#foreignType` (reflection.ts:864-868) hard-builds
`${as}_type` for the `as:` case:

```ts
get foreignType(): string | null {
  if (!this.options.polymorphic && !this.options.as) return null;
  if (this.belongsTo()) return `${underscore(this.name)}_type`;
  if (this.options.as) return `${underscore(this.options.as as string)}_type`;
  return null;
}
```

Rails honors an explicit `options[:foreign_type]` first
(`vendor/rails/activerecord/lib/active_record/reflection.rb:519`):

```ruby
@type = -(options[:foreign_type]&.to_s || "#{options[:as]}_type") if options[:as]
```

So a polymorphic has_many/has_one declared with an explicit `foreign_type:`
(e.g. `has_many :assets, as: :attachable, foreign_type: "attachable_kind"`)
diverges: trails emits `attachable_type`, Rails emits the declared
`attachable_kind`. This feeds `AssociationReflection#type` (reflection.ts:1033)
and thus the through-chain type predicate via `ThroughReflection#type`.

Not exercised by the canonical fixtures (none declare `foreign_type:` on an
`as:` source), so it is latent — but it is a real Rails deviation.

## Acceptance criteria

- [x] `foreignType` (and therefore `type`) honors `options.foreignType` for the
      `as:` case, mirroring reflection.rb:519: `options[:foreign_type] || "#{as}_type"`.
- [x] Add coverage for an `as:` association declared with an explicit
      `foreign_type:` (direct load + through-chain type predicate).
