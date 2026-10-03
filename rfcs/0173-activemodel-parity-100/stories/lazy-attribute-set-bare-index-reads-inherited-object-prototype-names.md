---
title: "activemodel: LazyAttributeSet/LazyAttributeHash read types, casted_values and default_attributes by bare index"
status: done
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8456
claim: "2026-10-03T20:52:08Z"
assignee: "call-gate-reads-array-prepend-as-module-prepend"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails#8442. `AttributeSet` no longer nulls its store's prototype, and reads
`@attributes` through `hashAref` / `hashAset` (ruby-compat `Hash#[]` / `Hash#[]=`), so a name
`Object.prototype` answers (`constructor`, `toString`) is an ordinary key. `LazyAttributeSet` and
`LazyAttributeHash` (`packages/activemodel/src/attribute-set/builder.ts`) still read their other
plain-object hashes by bare index: `this.types[name]` (`:102,132,279`), `this.castedValues[name]`
(`:103,135`) and `this.defaultAttributes[name]` (`:139,294`). On a `{}`-prototyped hash a bare
index returns the inherited function where Ruby's `Hash#[]` returns `nil`:
`types[name]`, `@casted_values[name]`, `default_attributes[name]`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:47-48,78-86,152-176`).
So `new LazyAttributeSet({}, {}, {}, {})` hands `Object.prototype.toString` to
`additional_types.fetch(name, types[name])` as the type for an attribute named `toString`.

## Acceptance criteria

- [ ] Every `types[name]` / `@casted_values[name]` / `default_attributes[name]` read in `builder.ts` goes through `hashAref` (writes through `hashAset`), in both `LazyAttributeSet` and `LazyAttributeHash`.
- [ ] A trails test covers an attribute named `constructor` and one named `toString` reaching each of the three hashes, failing on the current code.
- [ ] `pnpm parity:api:calls` and `pnpm vitest run packages/activemodel/src/attribute-set` green.
