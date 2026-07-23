---
title: "grouped-calculation-typed-keys"
status: claimed
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-23T12:46:36Z"
assignee: "grouped-calculation-typed-keys"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by residual-skip-tail-sweep (RFC 0030). Rails'
`Topic.group("date_trunc('month', created_at)").count` returns a Hash whose
keys are type-cast values — `adapters/postgresql/timestamp_test.rb:123-127`
(`test_group_by_date`) asserts `assert_kind_of Time, k` on every key. trails'
`groupedAggregate` (`packages/activerecord/src/relation/calculations.ts`,
non-association arm ~:552-566) already runs the key through the group column's
`deserialize`, but then `String()`-ifies it into a `Record<string, unknown>`,
so a Temporal key can never survive. Rails' `execute_grouped_calculation` →
`type_cast_calculated_value` keeps the cast object as the Hash key.

The association-keyed and composite-PK arms already return `Map<unknown,
unknown>`; the scalar/expression arm is the only one flattening keys to
strings. Converging it to a typed `Map` (or equivalent) changes the public
result shape of `group(...).count()/sum()/...` for expression groups —
existing tests index with `Object.values`/`c[key]` and must be migrated in the
same PR.

Blocks `adapters/postgresql/timestamp.test.ts` "group by date" (skipped,
annotated DEFERRED → this story; also listed in
`scripts/api-compare/unported-files.ts` — remove that entry when un-skipping).

## Acceptance criteria

- Expression/scalar grouped calculations key their result by the deserialized
  (type-cast) value, Rails-faithfully, not by `String()` of it.
- Callers of grouped calculations migrated to the new shape.
- Un-skip `adapters/postgresql/timestamp.test.ts` "group by date" and drop its
  unported-files entry; test passes under PG.
