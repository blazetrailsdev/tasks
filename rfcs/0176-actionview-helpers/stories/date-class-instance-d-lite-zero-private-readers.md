---
title: "date-class-instance-d-lite-zero-private-readers"
status: draft
updated: 2026-10-19
rfc: "0176-actionview-helpers"
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

The date gem defines `hour` / `min` / `minute` / `sec` / `second` on `Date` as PRIVATE methods returning 0 (`d_lite_zero`, `vendor/ruby/v3.3.11/ext/date/date_core.c:9485,9773-9777`). `DateTimeSelector`'s private readers reach them with `@datetime.send(method)` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/date_helper.rb:867-875`; trails `packages/actionview/src/helpers/date-helper.ts` `rbFSend(datetime, method)`), so `select_time(Date.new(...))` works in Rails.

trails seats them on `TEMPORAL_METHOD_TABLE["Temporal.PlainDate"]` only (`packages/date/src/date.ts`). A `@blazetrails/date` `Date` class instance still raises `NoMethodError` for `rbFSend(d, "min")`.

Blocker found while trying it: seating them on `Date.prototype` makes I18n's `localize` pick the time format for a Date, because `packages/i18n/src/backend/base.ts`'s `respondTo` is `name in object` and Ruby's `object.respond_to?(:sec) ? 'time' : 'date'` (i18n `backend/base.rb`) answers false only because the method is private. This reds `DateHelperTest > time tag with date` ("February 20, 2013 00:00"). It needs a seat that `rbFSend` dispatches but a `respond_to?` cannot see (what the Temporal table gives PlainDate), and that has to be squared with CLAUDE.md § "Method visibility is compile-time only".

## Acceptance criteria

- [ ] `rbFSend(new Date(...), "hour" | "min" | "minute" | "sec" | "second")` answers 0, and `I18n.l(new Date(...))` still uses the date format.
- [ ] A test covers `select_time` / `time_select` over a `Date` class instance.
