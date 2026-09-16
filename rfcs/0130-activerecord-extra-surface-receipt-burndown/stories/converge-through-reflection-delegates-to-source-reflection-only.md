---
title: "Converge ThroughReflection's foreign_key / foreign_type / type delegation onto source_reflection alone"
status: ready
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `foreign_key` onto a method in trails#7829.

Rails' `ThroughReflection` delegates `foreign_key` to the source reflection
alone
(`vendor/rails/activerecord/lib/active_record/reflection.rb:973-974`):

```ruby
delegate :foreign_key, :foreign_type, :association_foreign_key, :join_id_for, :type,
         :active_record_primary_key, :join_foreign_key, to: :source_reflection
```

Trails' `ThroughReflection#foreignKey`
(`packages/activerecord/src/reflection.ts`) adds a fallback Rails does not
have:

```ts
foreignKey(kwargs?: { inferFromInverseOf?: boolean }): string | string[] {
  return this.sourceReflection?.foreignKey(kwargs) ?? this.delegateReflection.foreignKey(kwargs);
}
```

When `source_reflection` is nil, Rails' delegate raises
`Module::DelegationError`; trails silently answers from `delegate_reflection`.
`foreignType` directly below it carries the same
`sourceReflection?.x ?? delegateReflection.x` fallback, and `type` returns
`null` where Rails would raise — both are the same delegation at `:973`.

## Acceptance criteria

- `ThroughReflection#foreignKey`, `#foreignType` and `#type` read from
  `sourceReflection` only, with no `delegateReflection` fallback, mirroring
  `reflection.rb:973-974`.
- A nil source reflection raises rather than falling back; any caller that
  relied on the fallback is converged, not re-guarded.
- `pnpm parity:api:calls` and `:args` gain no rows; the reflection and
  through-association suites stay green.
