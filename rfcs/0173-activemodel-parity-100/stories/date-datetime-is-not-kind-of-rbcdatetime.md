---
title: "ruby-compat/date: @blazetrails/date DateTime is a kind of rbCDate but not of rbCDateTime"
status: blocked
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8460
claim: "2026-10-03T22:56:10Z"
assignee: "class-methods-validates-with-appends-as-rails-does"
blocked-by: "AC1 premise is false: @blazetrails/date DateTime.now returns a Temporal value (toDatetime), a ZonedDateTime of which rbObjClass reads as Time; and one class object per Ruby class needs a decision on where the class lives, since ruby-compat cannot import @blazetrails/date and seating rbCDateTime from date.ts is load-order dependent (review of trails#8460). Remainder described in date-classes-are-one-class-object-per-ruby-class."
closed-reason: null
---

## Context

`rbObjClass` (`packages/ruby-compat/src/object.ts`) answers `rbCDateTime` for a
`Temporal.PlainDateTime` and `rbCDate` for a `Temporal.PlainDate`, and trails PR 8456 made
`@blazetrails/date`'s `Date` extend `rbCDate` and its `Time` extend `rbCTime`. The package's
`DateTime` (`packages/date/src/date.ts`, `export class DateTime extends DateWithoutParseStatics`)
extends its own `Date`, so `rbObjIsKindOf(dateTime, rbCDate)` is true and
`rbObjIsKindOf(dateTime, rbCDateTime)` is false. In MRI there is one `DateTime` class
(`cDateTime = rb_define_class("DateTime", cDate)`, `vendor/ruby/v3.3.11/ext/date/date_core.c:9984`),
so `DateTime === DateTime.now` is true.

`Clusivity#inclusion_method`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/clusivity.rb:40-52`) is unaffected,
because its `Date` arm answers. Any `when DateTime` arm that precedes or lacks a `Date` arm
misreads a `@blazetrails/date` `DateTime`.

## Converged shape

One class object per Ruby class: `rbObjClass` answers the same class for a Temporal seat and for
the `@blazetrails/date` instance, so `rbCDateTime` is in the ancestry of the package's `DateTime`
(and `rbCTime` / `rbCDate` are the package's `Time` / `Date`, not their superclasses).

## Acceptance criteria

- [ ] `rbObjIsKindOf(DateTime.now(), rbCDateTime)` is true for `@blazetrails/date`'s `DateTime`.
- [ ] `rbObjIsKindOf` of a `Temporal.PlainDateTime` and of a package `DateTime` agree for each of
      `rbCDateTime`, `rbCDate`, `rbCTime`.
- [ ] A trails test in `packages/date/src` covers both seats.
