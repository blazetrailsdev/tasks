---
title: "Converge pg bind type_cast to all binds (Rails type_casted_binds), gated on pinned-client serialization"
status: ready
updated: 2026-06-24
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps: ["pg-pinned-client-write-query-serialization"]
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `type_casted_binds`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:224-232`)
applies the adapter's `type_cast` to **every** bind's `value_for_database`
unconditionally:

```ruby
def type_casted_binds(binds)
  binds&.map do |value|
    if ActiveModel::Attribute === value
      type_cast(value.value_for_database)
    else
      type_cast(value)
    end
  end
end
```

PG's `type_cast`
(`connection_adapters/postgresql/quoting.rb:169-187`) then dispatches a full
case: `Binary::Data`, `Xml::Data`/`Bit::Data → to_s`, `Array::Data →
encode_array`, `Range → encode_range`, `Rational → to_f`, else `super`
(`abstract/quoting.rb:94`: `Symbol`/`Multibyte`/`Binary::Data → to_s`,
`true`/`false → unquoted_true/false`, `BigDecimal → to_s("F")`,
`nil`/`Numeric`/`String` passthrough, `Type::Time::Value → quoted_time`,
`Date`/`Time → quoted_date`).

trails diverges: the pg bind path (`postgresql-adapter.ts` `_bindForPg`,
applied after `typeCastedBinds` extracts `value_for_database`) applies
`typeCast` **narrowly** — only to the object wrappers `Range`, `ArrayData`,
`XmlData`, `BitData` (+ duck-typed `BinaryData`), introduced by
`force-equality-bind-convergence` (PR #4062). Scalars and other cast cases
(`Rational → to_f`, `BigDecimal → to_s("F")`, `Symbol → to_s`,
`true/false → unquoted_true/false`) bypass `typeCast` and fall through to
`temporalToBindString`.

This narrowing is **deliberate**: binding all write-path values through the
adapter exposes the documented single-pinned-client query-overlap hang
(idle-in-transaction) — see blocker
`pg-pinned-client-write-query-serialization` (RFC 0030) and the parked PR #3880.
In practice the omitted scalar cases are mostly passthrough in Rails
(`Numeric`/`String`/`nil`) or don't arise as JS bind values
(`Rational`/`Symbol`), so the current narrow gate is behaviorally safe today —
but it is a structural deviation from Rails' "type_cast every bind", and any
future scalar type whose `value_for_database` differs from its `type_cast`
output (e.g. a `BigDecimal`-shaped value needing `to_s("F")`) would silently
diverge.

## Acceptance criteria

- [ ] pg bind path routes **every** bind's `value_for_database` through the
      adapter `typeCast` (matching `type_casted_binds`), so the full PG
      `type_cast` case (incl. scalar `Rational`/`BigDecimal`/`Symbol`/boolean
      normalization) applies — not just the object-wrapper subset.
- [ ] Does NOT reintroduce the single-pinned-client write-query hang: this is
      gated behind `pg-pinned-client-write-query-serialization`; land only once
      the write-path query-overlap serialization fix is in.
- [ ] `test:compare` non-negative; PG range/array/bit/xml suites stay green;
      no idle-in-transaction / advisory-slot timeout under the PG lane.

Notes: this is the generalization of the narrow gate shipped in #4062. Keep the
object-wrapper handling correct; the work is widening the gate to all binds once
the pinned-client serialization prerequisite removes the hang risk.

Hard rules: camelCase only; NO node:_/process._; async fs only; 500 LOC ceiling;
single PR from main; draft.
