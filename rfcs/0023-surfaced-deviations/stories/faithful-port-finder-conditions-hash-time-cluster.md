---
title: "faithful-port-finder-conditions-hash-time-cluster"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to faithful-port-finder-conditions-cluster (PR #4425), which ported
the `finder_test.rb` `include?`/`member?` cluster onto canonical
Customer/Cpk::Book/Author fixtures. The remaining synthetic coverage in
packages/activerecord/src/finder.test.ts — hash/array conditions, ranges, bind
variables, condition interpolation, and the UTC/local time-interpolation
tests — is still thin ad-hoc coverage on inline `class Topic`/`class Post`
stubs (`makeModel()`, `defineSchema(canonicalSchema)` inline attribute stubs).

Split from the parent story because the include/member port alone reached the
500 LOC PR ceiling.

Rails source: vendor/rails/activerecord/test/cases/finder_test.rb

- `test_find_on_hash_conditions*` (approved/qualified-dot-notation/hashed-table/
  range/end-exclusive-range/multiple-ranges/array-of-integers-and-ranges/
  array-of-ranges/open-ended-range/numeric-range-for-string) — port onto
  canonical Topic + Comment fixtures.
- `test_condition_interpolation` / `test_condition_array_interpolation` /
  `test_condition_hash_interpolation` — Company/Firm STI + Topic.
- `test_bind_variables` / `test_named_bind_variables` (+ `_with_quotes`) —
  Company + Topic.
- `test_hash_condition_find_with_array` / `_with_nil` / `_malformed` — Post/Topic.
- `test_condition_utc_time_interpolation_with_default_timezone_local` and the
  three sibling hash/local variants — Topic + `withTimezoneConfig` (see
  base.test.ts usage). Note: no `withEnvTz` helper exists yet; assess whether a
  faithful port needs one or whether `withTimezoneConfig` suffices.
- `test_hash_condition_find_with_aggregate_*` (Money/Address/GpsLocation via
  composedOf) — only if the where-clause aggregate expansion is supported;
  otherwise scope out and note the gap.

## Acceptance criteria

- [ ] Port each remaining conditions/hash/bind/time-interpolation test onto
      canonical models + real fixtures; drop synthetics with no Rails counterpart.
- [ ] Test names match Rails verbatim; require-canonical-schema stays clean.
- [ ] 500 LOC ceiling; single PR from main.
