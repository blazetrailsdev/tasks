---
title: "ruby-compat/date: one class object per Ruby Date / DateTime / Time; DateTime.now is a DateTime"
status: draft
updated: 2026-10-03
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/date/src/date.ts` now seats ruby-compat's `rbCDateTime` beneath the package's `Date`
(`Object.setPrototypeOf(rbCDateTime, Date)`) and has `DateTime` extend it, so a package `DateTime`
and a `Temporal.PlainDateTime` agree under `rbObjIsKindOf` for `rbCDateTime` / `rbCDate` / `rbCTime`.
Two class objects per Ruby class remain: `rbObjClass(new DateTime(…))` is the package `DateTime`
while `rbObjClass(Temporal.PlainDateTime)` is `rbCDateTime`, and likewise `Date` / `rbCDate` and
`Time` / `rbCTime` (`packages/ruby-compat/src/object.ts`, `rbObjClass`). MRI has one
(`vendor/ruby/v3.3.11/ext/date/date_core.c:9604,9984`).

Separately, the package's `DateTime.now` (`packages/date/src/date.ts`, `static now`) returns a
`Temporal.PlainDateTime | Temporal.ZonedDateTime`, not a `DateTime`; a `ZonedDateTime` reads as
`rbCTime`, so `rbObjIsKindOf(DateTime.now(), rbCDateTime)` can be false where MRI's
`DateTime === DateTime.now` is true (`date_core.c` `datetime_s_now`).

`ValidationsClassMethods.validatorsOn` (`packages/activemodel/src/validations.ts`) reads with
`fetch(_validators, attribute, [])` where Rails reads `_validators[attribute.to_sym]`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb:268`), which stores the default.

## Acceptance criteria

- [ ] `rbObjClass` answers one class object for a Temporal seat and the `@blazetrails/date`
      instance, for each of `Date`, `DateTime`, `Time`.
- [ ] `rbObjIsKindOf(DateTime.now(), rbCDateTime)` is true for every return of the package's
      `DateTime.now`.
- [ ] `validatorsOn` reads `_validators` as `validations.rb:268` does.
