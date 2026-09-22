---
title: "AttributeMutationTracker#changes / #changed_values return a plain object where Rails returns HashWithIndifferentAccess"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `assertions-activemodel-dirty-serialization-callbacks` (RFC 0132,
trails#7907) while converging `dirty_test.rb` / `attributes_dirty_test.rb`
assertions.

Rails' mutation tracker builds every hash it returns **with indifferent
access**:

```ruby
def changed_values
  attr_names.each_with_object({}.with_indifferent_access) do |attr_name, result|
    ...
def changes
  attr_names.each_with_object({}.with_indifferent_access) do |attr_name, result|
```

(`vendor/rails/activemodel/lib/active_model/attribute_mutation_tracker.rb:18-32`).

trails' port returns a plain object in both
(`packages/activemodel/src/attribute-mutation-tracker.ts:46-63` —
`changedValues(): Record<string, unknown>` and
`changes(): Record<string, [unknown, unknown]>` each start from `{}`), and the
`Dirty` readers that delegate to them inherit it:
`Dirty#changes`, `#previousChanges` and `#changedAttributes`
(`packages/activemodel/src/dirty.ts:88-98`) are typed and built as plain
records.

Why it is observable, not cosmetic: Rails' own tests assert the hash TYPE, not
just its contents —
`assert_equal ActiveSupport::HashWithIndifferentAccess.new, @model.previous_changes`
(`activemodel/test/cases/dirty_test.rb:198-199`,
`attributes_dirty_test.rb:148-149`) — and the two-arm lookups at
`dirty_test.rb:79-80` / `attributes_dirty_test.rb:53-54`
(`changes[:name]` and `changes["name"]`) exist precisely because the hash is
indifferent. trails happens to pass those today only because a Ruby Symbol
ports to the same JS string, so the divergence is silent.

`HashWithIndifferentAccess` already exists in trails
(`packages/activesupport/src/hash-with-indifferent-access.ts`), so this is a
return-shape convergence, not a new type.

Note the NullMutationTracker arm: Rails returns a bare `{}` there
(`attribute_mutation_tracker.rb:163-169`), NOT an indifferent hash, so
`packages/activemodel/src/attribute-mutation-tracker.ts:207-213` is already
correct and must not be "fixed" along with the other two.

## Converged shape

`changedValues()` and `changes()` on `AttributeMutationTracker` each build and
return a `HashWithIndifferentAccess`, matching
`attribute_mutation_tracker.rb:18-32` arm for arm; `NullMutationTracker`'s
stay plain `{}`. `Dirty#changes` / `#previousChanges` / `#changedAttributes`
carry the resulting type through.

## Acceptance criteria

- [ ] `AttributeMutationTracker#changedValues` and `#changes` return a
      `HashWithIndifferentAccess`; `NullMutationTracker`'s two stay `{}`.
- [ ] `Dirty#changes`, `#previousChanges` and `#changedAttributes` expose that
      type rather than `Record<string, ...>`.
- [ ] `pnpm parity:test -- --package activemodel --assertions` still reports 0
      count/kind/value mismatches for `dirty_test.rb` and
      `attributes_dirty_test.rb`, and their `previous_changes` /
      `changed_attributes` assertions compare against an empty indifferent hash
      the way Rails does.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:extra:gate` stay clean.
