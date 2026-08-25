---
title: "Decide defined_for?'s order-dependent option-narrowing accumulator"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Ruby block-scoping fallout, unreachable without 3+ FKs with divergent option sets, and replicating it would make matching adapter-introspection-order dependent; declined in review on #5450."
---

## Context

Rails' `ForeignKeyDefinition#defined_for?`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:161-166`)
reassigns its block-local `options` on every iteration:

```ruby
def defined_for?(to_table: nil, validate: nil, **options)
  options = options.slice(*self.options.keys)
  ...
end
```

Because `foreign_key_for` calls it inside a `detect` block
(`schema_statements.rb`), each candidate foreign key permanently narrows the
option set that _later_ candidates are compared against — matching is
order-dependent on foreign-key introspection order.

trails' `isDefinedFor`
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`)
recomputes the slice fresh from the caller's options per candidate, so it is
order-independent.

Raised in review on #5450 and declined there: introspection order differs per
adapter, so replicating the accumulator would make trails' match result
adapter-dependent, and the behavior reads as Ruby block-scoping fallout rather
than a deliberate contract. Filed for triage because "fidelity first" is the
house rule and the call was made in-flight.

Unreachable without 3+ foreign keys on the same table pair with divergent stored
option-key sets — no Rails test or trails test reaches it.

## Acceptance criteria

- [ ] Decide explicitly: either thread the narrowing accumulator to match Rails
      literally, or record the divergence as intentional in the code with the
      Rails `file:line` and the adapter-order reasoning.
- [ ] If converging, a test pins the order-dependent narrowing with 3+ foreign
      keys on the same table pair.
- [ ] `foreign_key_exists?` / `remove_foreign_key` / `foreign_key_for` callers
      stay green on all three adapters.
