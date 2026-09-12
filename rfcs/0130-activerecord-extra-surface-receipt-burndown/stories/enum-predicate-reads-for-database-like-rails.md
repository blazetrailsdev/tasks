---
title: "Enum predicate reads *_for_database like Rails, not castEnumValue"
status: ready
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails defines the enum predicate against the attribute's database form
(`vendor/rails/activerecord/lib/active_record/enum.rb:305`):

```ruby
define_method("#{value_method_name}?") { public_send(:"#{name}_for_database") == value }
```

trails' `EnumMethods#defineEnumMethods` (`packages/activerecord/src/enum.ts`,
the `predicateName` carrier property) instead recomputes that value through an
invented helper:

```ts
return castEnumValue(recordClass, name, this.readAttribute(name)) === value;
```

`castEnumValue` (a free function carrying
`@noRailsEquivalent CONVERGEABLE converge-receipted-activerecord-root-and-adapter-names`)
serializes the cast value through `enumTypeOf(...)`. `{name}ForDatabase` is
already generated for enum columns (`enum-before-type-cast-and-for-database`,
trails#4722), so nothing blocks calling it the way Rails does.

## Acceptance criteria

- The predicate body reads `this[`${camelize(name)}ForDatabase`]` (or the
  generated reader's trails spelling) `=== value`, with no `castEnumValue` call.
- `castEnumValue`'s remaining callers are only tests. Delete it there too,
  asserting via `EnumType#serialize` or `*ForDatabase`, and drop its receipt row
  from `converge-receipted-activerecord-root-and-adapter-names`.
- `enum.test.ts` / `enum.trails.test.ts` stay green on all adapter lanes.
