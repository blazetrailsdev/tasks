---
title: "date-class-instance-d-lite-zero-private-readers"
status: done
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9150
claim: "2026-10-20T19:48:40Z"
assignee: "date-class-instance-d-lite-zero-private-readers"
blocked-by: null
closed-reason: null
---

## Context

The date gem defines `hour` / `min` / `minute` / `sec` / `second` on `Date` as PRIVATE methods returning 0 (`d_lite_zero`, `vendor/ruby/v3.3.11/ext/date/date_core.c:9485,9773-9777`). `DateTimeSelector`'s private readers reach them with `@datetime.send(method)` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/date_helper.rb:867-875`; trails `packages/actionview/src/helpers/date-helper.ts` `rbFSend(datetime, method)`), so `select_time(Date.new(...))` works in Rails.

trails seats them on `TEMPORAL_METHOD_TABLE["Temporal.PlainDate"]` only (`packages/date/src/date.ts`). A `@blazetrails/date` `Date` class instance still raises `NoMethodError` for `rbFSend(d, "min")`.

Blocker found while trying it: seating them on `Date.prototype` makes I18n's `localize` pick the time format for a Date, because `packages/i18n/src/backend/base.ts`'s `respondTo` is `name in object` and Ruby's `object.respond_to?(:sec) ? 'time' : 'date'` (i18n `backend/base.rb`) answers false only because the method is private. This reds `DateHelperTest > time tag with date` ("February 20, 2013 00:00"). It needs a seat that `rbFSend` dispatches but a `respond_to?` cannot see (what the Temporal table gives PlainDate), and that has to be squared with CLAUDE.md § "Method visibility is compile-time only".

## Ruling

Owner ruling 2026-10-20: use the table seat, as `Temporal.PlainDate` already does (`packages/date/src/date.ts:6802-6811`). A `TEMPORAL_METHOD_TABLE` entry (`packages/ruby-compat/src/object.ts:556`) is reached by `rbFSend` (`object.ts:1140`) and `rbObjRespondTo` (`:637`), but not by a JS `name in object`, which is how i18n's `respondTo` reads `respond_to?(:sec)`. So `send(:min)` answers 0 and `localize` still picks the date format, with no `Date.prototype` member and no runtime visibility carrier.

The lookup is keyed by `temporalTag(obj)`, or `"Date"` for a JS `Date` (`object.ts:569`). A JS `Date` spells a Ruby **Time**, so the `"Date"` key cannot be reused for a `@blazetrails/date` `Date` instance (`date.ts:4521`, `class Date extends rbCDate`). The instance needs its own key. A `DateTime` instance must not reach it: Ruby's `DateTime` defines public `hour` / `min` / `sec`. That holds already, because a prototype member is found before the table, but it needs a test.

## Acceptance criteria

- [ ] `TEMPORAL_METHOD_TABLE` has a seat for a `@blazetrails/date` `Date` instance that is not the JS-`Date` (Ruby Time) `"Date"` key, and `date.ts` seats `hour` / `min` / `minute` / `sec` / `second` as `dLiteZero` there, next to the `Temporal.PlainDate` seat. No `Date.prototype` member is added.
- [ ] `rbFSend(new Date(...), "hour" | "min" | "minute" | "sec" | "second")` answers 0, and `I18n.l(new Date(...))` still uses the date format (`DateHelperTest > time tag with date` stays green).
- [ ] `rbFSend(new DateTime(...), "hour")` still answers the DateTime's hour.
- [ ] A test covers `select_time` / `time_select` over a `Date` class instance.
