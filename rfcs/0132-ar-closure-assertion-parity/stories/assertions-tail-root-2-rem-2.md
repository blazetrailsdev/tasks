---
title: "assertions-tail-root-2-rem-2"
status: draft
updated: 2026-09-20
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Residue of `assertions-tail-root-2-rem` (RFC 0132), which converged
`relation/mutation_test.rb`, `readonly_test.rb`, `invertible_migration_test.rb`,
`database_selector_test.rb`, `encryption/encryptable_record_api_test.rb`,
`active_record_schema_test.rb` (all but one test) and `attributes_test.rb` (all
but one test) to 0 count/kind/value mismatches. That PR hit the 700 LOC
ceiling; three items are left, each needing work beyond an assertion rewrite.

1. **`date_time_precision_test.rb` — 18 rows, untouched.**
   Measure with `pnpm parity:test -- --package activerecord --assertions`.
   Most rows are tests whose trails count is 0 (stubs or PG-only arms that
   were never ported): `formatting datetime according to precision when time
zone aware` (rails 7 / trails 0), the two `using timestamptz` twins,
   `writing a blank/date/time with zone attribute timestamptz`, and
   `datetime precision with zero should be dumped` (rails 2 `assert_match`).
   Plus `no datetime precision isnt truncated on assignment` (rails 4 equal /
   trails 2) and `schema dump with default precision is not dumped`
   (rails 2 `match` / trails 1 `match` + 1 `noMatch`).
   Rails: `vendor/rails/activerecord/test/cases/date_time_precision_test.rb`;
   trails: `packages/activerecord/src/date-time-precision.test.ts`.

2. **`active_record_schema_test.rb` — `schema version accessor`.**
   Rails (`active_record_schema_test.rb:44-48`) is
   `schema_class = ActiveRecord::Schema[6.1]` then two `assert` (truthy).
   trails has no `Schema.[]`. Rails' `schema.rb:70-77` builds
   `Class.new(Migration::Compatibility.find(version)) { include Definition }`,
   memoized in `@class_for_version`. trails' `packages/activerecord/src/schema.ts`
   models `Definition` as a bare TS `interface`, so there is nothing to
   `include` into the generated subclass — converging the test means giving
   `Definition` a real runtime shape (`include()` / `extend()` from
   `@blazetrails/activesupport`, per CLAUDE.md § "Module mixins") and then
   adding `Schema.get(version)`. Note trails' `Migration/Compatibility`
   registry only carries V7_1/V7_2/V8_0, so a `6.1` literal has no entry
   either — check whether that is a separate gap to file.

3. **`attributes_test.rb` — `overloaded properties save`.**
   Rails (`attributes_test.rb:35-46`) asserts
   `assert_kind_of Integer, OverloadedType.last.overloaded_float` and
   `assert_kind_of Float, UnoverloadedType.last.overloaded_float`. JS has one
   `number` type and no `Integer`/`Float` class, so there is no `instanceOf`
   twin — the port reads `Number.isInteger(...)`, which scores `equal`.
   Decide whether this is a ratifiable language shortcoming (and where the
   receipt lives) or whether the assertion-kind normalizer should grow a fold;
   do not paper over it with a rename.

## Acceptance criteria

- `date_time_precision_test.rb` reports 0 count/kind/value mismatches.
- `active_record_schema_test.rb` reports 0 (i.e. `schema version accessor`
  converged, via a real `Schema::Definition` mixin plus `Schema.get`).
- `attributes_test.rb` reports 0, or the `Integer`/`Float` `assert_kind_of`
  case is resolved with a reviewed receipt rather than a rewritten assertion.
- No test renames. The assertion mark file stays frozen.
