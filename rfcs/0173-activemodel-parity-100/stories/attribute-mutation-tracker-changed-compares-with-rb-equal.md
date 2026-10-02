---
title: "activemodel: AttributeMutationTracker#changed? compares with Ruby == (rbEqual), not ==="
status: claimed
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-10-02T16:41:58Z"
assignee: "arel-attribute-and-sql-literal-are-not-nodes"
blocked-by: null
closed-reason: null
---

## Context

`AttributeMutationTracker#changed?`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_mutation_tracker.rb:44-48`) compares
with Ruby `==`:

    (OPTION_NOT_GIVEN == from || original_value(attr_name) == type_cast(attr_name, from)) &&
      (OPTION_NOT_GIVEN == to || fetch_value(attr_name) == type_cast(attr_name, to))

The port (`packages/activemodel/src/attribute-mutation-tracker.ts:84-91`) compares through a
file-local `valuesEqual` (`:29-34`), which is `===` plus a NaN arm. So two equal Arrays, Hashes,
BigDecimals, Dates or Temporal values compare unequal where Ruby's `==` answers true, and
`changed?(from: [1], to: [2])` is false for an Array-typed attribute. The NaN arm is also not
Ruby's: `Float::NAN == Float::NAN` is false.

Seen while converging the arms of `isChanged` in trails PR 8386, which kept `valuesEqual` as it was.

## Acceptance criteria

- [ ] Both comparisons go through ruby-compat's `rbEqual`; `valuesEqual` is deleted.
- [ ] A `.trails.test.ts` case covers `isChanged(name, { from, to })` with an Array or Date value
      and fails on the current body.
- [ ] `pnpm parity:api:calls` stays green.
