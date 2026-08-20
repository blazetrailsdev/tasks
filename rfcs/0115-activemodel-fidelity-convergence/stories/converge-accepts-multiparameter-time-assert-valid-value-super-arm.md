---
title: "Restore assert_valid_value's else super(value) arm in Date/DateTime/Time"
status: in-progress
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6774
claim: "2026-08-20T15:22:34Z"
assignee: "port-activejob-test-helper-for-destroy-association-async"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/type/helpers/accepts_multiparameter_time.rb:25-31`:

```ruby
def assert_valid_value(value)
  if value.is_a?(Hash)
    value_from_multiparameter_assignment(value)
  else
    super(value)
  end
end
```

All three types that include the module drop the `else super(value)` arm:

- `packages/activemodel/src/type/date.ts:206-208`
- `packages/activemodel/src/type/date-time.ts:212-214`
- `packages/activemodel/src/type/time.ts:241-243`

Each is spelled `if (isPlainObject(value)) this.valueFromMultiparameterAssignment(value);`
with no `else` — a non-hash value is never validated at all.

`ActiveModel::Type::Value#assert_valid_value` (value.rb) is a no-op, so nothing
observable breaks today. It bites the moment an ancestor or a subclass supplies
a real one: ActiveRecord's `Type::Serialized`, the enum types and several PG OID
types override `assert_valid_value` to raise, and a type inheriting from these
three would silently skip it on the non-hash path — the ordinary path.

The wrapper in `packages/activemodel/src/type/helpers/accepts-multiparameter-time.ts:44-50`
already ports both arms correctly (`this.type.assertValidValue(value)` on the
else); only the three inlined copies in the type classes are short.

## Acceptance criteria

- `assertValidValue` in `date.ts`, `date-time.ts` and `time.ts` carries both
  arms, the else calling `super.assertValidValue(value)`.
- A test per type pinning that a non-hash value reaches `super` — e.g. a
  subclass whose `assertValidValue` raises, asserting it raises for a scalar and
  not for a multiparameter hash.
- `pnpm parity:api:calls` clean (the `super` call currently missing from the
  call set is exactly what that gate measures).
