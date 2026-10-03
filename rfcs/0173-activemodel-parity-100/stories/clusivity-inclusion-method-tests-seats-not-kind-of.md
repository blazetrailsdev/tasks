---
title: "activemodel: Clusivity#inclusion_method tests nine value seats where Rails names four classes; ruby-compat has no kind_of?"
status: ready
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Clusivity#inclusion_method`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/clusivity.rb:40-52`) is one
`case enumerable.begin || enumerable.end` with `when Numeric, Time, DateTime, Date`, which is
`Module#===` (`rb_obj_is_kind_of`, `vendor/ruby/v3.3.11/object.c:865`) against four classes.

`inclusionMethod` (`packages/activemodel/src/validations/clusivity.ts`, trails PR 8439) spells it
as a `switch (true)` over nine seat tests: `typeof` number / bigint, `instanceof` `Rational`,
`BigDecimal`, `Complex`, `Time`, and `Temporal.Instant` / `ZonedDateTime` / `PlainDateTime` /
`PlainDate`. ruby-compat has no `kind_of?`: `rbObjClass` (`packages/ruby-compat/src/object.ts:35`)
already maps every one of those seats to a class, but `rbCNumeric`, `rbCTime` and `rbCDate`
(`object.ts:202-220`) are not exported, `Rational` / `BigDecimal` / `Complex` do not descend from
`rbCNumeric`, and `@blazetrails/date`'s `Time` is not `rbCTime`. A JS `Date` endpoint, which
`rbObjClass` reads as a `Time`, takes the `include?` arm.

## Converged shape

`rbObjIsKindOf(obj, klass)` in ruby-compat, answering through `rbObjClass` and the class ancestry,
with the Numeric classes under `rbCNumeric` and one `Time` class. `inclusionMethod` is then four
arms in Rails' order: `Numeric`, `Time`, `DateTime`, `Date`.

## Acceptance criteria

- [ ] ruby-compat exports `rbObjIsKindOf`, cited to `object.c:865`, and the four class objects.
- [ ] `inclusionMethod` tests exactly `Numeric, Time, DateTime, Date`, with no `typeof`, no
      `instanceof` and no Temporal name.
- [ ] `clusivity.trails.test.ts`'s per-endpoint test passes, and its JS `Date` range case answers
      `cover`.
