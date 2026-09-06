---
title: "DateTimeType#changed? and TimeZoneConverter#changed? are trails-only overrides Rails does not have"
status: blocked
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Hard prereq not landed: the story's converged shape is 'delete both per-type isChanged overrides and inherit the generic one', which requires Value#changed? to compare with Ruby != semantics first. That generic seam is converge-value-type-changed-to-ruby-equality (RFC 0023), still draft. Verified on origin/main that the overrides are all still present and load-bearing: type/date-time.ts:120, time-zone-conversion.ts:119 plus _nsAtPrecision:131 and toInstantOrNull:177 — deleting them before the generic seam lands regresses dirty tracking to reference equality (the live bug PR #7537 hit with time_zone_aware_attributes on and Time.zone unset). Unblocks the moment the 0023 story ships."
closed-reason: null
---

## Context

`ActiveModel::Type::Value#changed?` is `old_value != new_value`
(`activemodel/lib/active_model/type/value.rb:84-86`), and neither
`Type::DateTime` nor `TimeZoneConverter` overrides it — grep
`activemodel/lib/active_model/type/date_time.rb` and
`activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb`:
there is no `changed?` in either file.

trails carries two overrides that Rails does not have, both standing in for the
same JS shortcoming (`!==` is reference equality, so two value objects holding
the same instant never compare equal):

- `DateTimeType#isChanged` (`packages/activemodel/src/type/date-time.ts:120-125`)
  — `oldValue.toR().cmp(newValue.toR()) !== 0`.
- `TimeZoneConverter#isChanged`
  (`packages/activerecord/src/attribute-methods/time-zone-conversion.ts:125-137`)
  plus its `toInstantOrNull` and `_nsAtPrecision` helpers.

Surfaced by PR #7537, which had to add a `RubyTime` arm to BOTH of them when the
datetime cast seam started answering a Ruby `::Time`. The second one was a live
bug for the whole review round: with `time_zone_aware_attributes` on and
`Time.zone` unset, `cast` returns a bare `::Time` and `changed?` fell through to
reference equality, so every read-after-cast round trip reported as changed.
Two per-type overrides means every new value type repeats the fix — or, as
here, silently doesn't.

Prior art: `converge-value-type-changed-to-ruby-equality` (0023, draft) covers
the generic `Value#changed?` seam and `type/value.ts`. This story is the
dependent half — deleting the two per-type overrides once generic Ruby equality
lands — and is filed separately because those two files are not in that story's
`story_paths` and Rails having no override in them is the specific
deviation.

## Converged shape

`Value#changed?` compares with Ruby `!=` semantics (structural for value
objects), so `DateTimeType#isChanged` and `TimeZoneConverter#isChanged` are
deleted outright along with `toInstantOrNull` and `_nsAtPrecision`, and both
classes inherit `changed?` exactly as they do in Rails.

## Acceptance criteria

- [ ] `DateTimeType#isChanged` is deleted; `date_time.rb` has no `changed?`.
- [ ] `TimeZoneConverter#isChanged`, `toInstantOrNull` and `_nsAtPrecision` are
      deleted; `time_zone_conversion.rb` has no `changed?`.
- [ ] Dirty tracking still treats two distinct `::Time`s at the same instant as
      unchanged, with `Time.zone` both set and unset — the regression test in
      `time-zone-conversion.trails.test.ts` still passes.
