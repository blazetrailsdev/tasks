---
title: "converge-attribute-methods-test-time-zone-arms"
status: in-progress
updated: 2026-08-29
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 24
pr: 7216
claim: "2026-08-29T17:51:37Z"
assignee: "converge-format-for-inspect-filter-order"
blocked-by: null
closed-reason: null
---

## Context

PR (converge-attribute-methods-test-off-makemodel, part 1) converged 13 of
`AttributeMethodsTest`'s `makeModel()` callers onto canonical models in
`packages/activerecord/src/attribute-methods.test.ts`. The 14 time-zone-aware
arms still hang off `makeModel()` with placeholder assertions
(`await Post.create({ title: "tz_read" })` then `expect(p.title).toBe("tz_read")`).

Rails counterparts, `vendor/rails/activerecord/test/cases/attribute_methods_test.rb`:

- `setting time zone-aware read attribute` (:793)
- `setting time zone-aware attribute with a string` (:804)
- `time zone-aware attribute saved` (:818)
- `setting a time zone-aware attribute to a blank string returns nil` (:828)
- `setting a time zone-aware attribute interprets time zone-unaware string in time zone` (:837)
- `setting a time zone-aware datetime in the current time zone` (:850)
- `YAML dumping a record with time zone-aware attribute` (:861)
- `setting a time zone-aware time in the current time zone` (:874)
- `setting a time zone-aware time with DST` (:889)
- `setting invalid string to a zone-aware time attribute` (:903)
- `removing time zone-aware types` (:913)
- `time zone-aware attributes do not recurse infinitely on invalid values` (:925)
- `time zone-aware custom attributes` (:955)
- `setting a time_zone_conversion_for_attributes should write the value on a class variable` (:990)

All of them read `Topic` (or a `Class.new(ActiveRecord::Base)` on the topics
table) under `in_time_zone`, several through the private
`with_time_zone_aware_types(*types)` helper (:1571). `inTimeZone` is already
imported in the trails file from `./cases/helper.js`.

## Acceptance criteria

- [ ] Each of the 14 tests reads the canonical model its Rails counterpart
      reads and asserts what Rails asserts.
- [ ] `with_time_zone_aware_types` is ported as the private helper Rails has,
      not inlined per test.
- [ ] `pnpm parity:test:assertions` delta non-negative; AR suite green on all
      three lanes.
