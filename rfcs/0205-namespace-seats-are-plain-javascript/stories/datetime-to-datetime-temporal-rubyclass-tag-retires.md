---
title: "datetime-to-datetime-temporal-rubyclass-tag-retires"
status: ready
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
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

trails#9400 removed the `rubyClass` brand from `Duration`, `Duration::Scalar`, `TimeWithZone` and `Date::Infinity`, so `rbObjClassname` is now `rbModToS(rbObjClass(x))`. One use of the brand is left: `DateTime#toDatetime` (`packages/date/src/date.ts`, `Object.defineProperty(zoned, rubyClass, { value: "DateTime" })`) tags a `Temporal.ZonedDateTime`, and `rbObjClass` (`packages/ruby-compat/src/object.ts`) reads that tag to answer `rbCDateTime` instead of `rbCTime`. Ruby's `DateTime#to_datetime` answers `self` (`vendor/ruby/v3.3.11/ext/date/date_core.c`, `datetime_to_datetime`), so no Temporal value needs a class tag.

## Acceptance criteria

- [ ] `DateTime#toDatetime` stops answering a tagged Temporal value, which converges on Ruby's `self`. Any caller that relied on the Temporal shape is converged.
- [ ] The `rubyClass` symbol and its export are deleted from `packages/ruby-compat/src/comparable.ts` and `index.ts`, and `rbObjClass` loses its tag arm.
