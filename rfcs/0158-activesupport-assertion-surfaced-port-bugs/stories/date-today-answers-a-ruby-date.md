---
title: "date-today-answers-a-ruby-date"
status: draft
updated: 2026-11-19
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Ruby's `Date.today` (`date_s_today`, `vendor/date/v3.4.1/ext/date/date_core.c`) answers a `Date`. `@blazetrails/date`'s `static today` (`packages/date/lib/date.ts:4823`) answers a `Temporal.PlainDate`. Callers such as `packages/activesupport/test/core-ext/date-ext.test.ts` "current returns date today when zone not set" have to compare through `toDate()`.

## Acceptance criteria

- `Date.today()` answers a `Date` (a `DateTime` when called on `DateTime`), as MRI does.
- Callers relying on a `PlainDate` are converged.
