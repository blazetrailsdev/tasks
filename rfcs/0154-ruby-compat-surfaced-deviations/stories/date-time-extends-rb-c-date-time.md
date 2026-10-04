---
title: "date's DateTime extends ruby-compat's rbCDateTime"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`@blazetrails/date`'s `DateTime` does not descend from ruby-compat's
`rbCDateTime` (`packages/ruby-compat/src/object.ts:233`,
`rbDefineClass("DateTime", rbCDate)`). `Date` extends `rbCDate`
(`packages/date/src/date.ts:4507`) and `Time` extends `rbCTime`
(`packages/date/src/time.ts:408`), but `DateTime` extends a local
`DateWithoutParseStatics` (`packages/date/src/date.ts:5842`), so
`new DateTime(...) instanceof rbCDateTime` is false.

In MRI `cDateTime = rb_define_class("DateTime", cDate)`
(`vendor/ruby/v3.3.11/ext/date/date_core.c:9984`).

Surfaced by trails PR 8476: `Psych::Visitors::YAMLTree#accept`
(`packages/ruby-compat/src/psych/visitors/yaml-tree.ts`) dispatches `Date` and
`Time` on `rbCDate` / `rbCTime`, and has to read `DateTime` from the constant
table (`registeredConstant("DateTime")`) because of this gap.

## Acceptance criteria

- [ ] `DateTime.prototype instanceof rbCDateTime` is true, with `DateTime`
      still a `Date` (`rbCDateTime`'s superclass is `rbCDate`).
- [ ] `YAMLTree#accept` tests `target instanceof rbCDateTime` and drops the
      `registeredConstant("DateTime")` read.
- [ ] `packages/activesupport/src/yaml.trails.test.ts` "dumps a DateTime under
      !ruby/object:DateTime, not as a Date" stays green.
