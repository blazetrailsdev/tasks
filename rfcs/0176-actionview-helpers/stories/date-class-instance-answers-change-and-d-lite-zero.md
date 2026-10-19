---
title: "Date class instances answer Date#change"
status: ready
updated: 2026-10-19
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9055 seated ActiveSupport's `Date#change` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/date/calculations.rb:143-149`) on `TEMPORAL_METHOD_TABLE["Temporal.PlainDate"]` only (`packages/activesupport/src/core-ext/date/calculations.ts`). The same PR seated the date gem's private `hour`/`min`/`minute`/`sec`/`second` (`d_lite_zero`, `vendor/ruby/v3.3.11/ext/date/date_core.c:9773-9777`) on that table only (`packages/date/src/date.ts`). A `@blazetrails/date` `Date` class instance (`new Date(...)` rather than `Date.civil`, which returns a PlainDate) still raises `NoMethodError` for `rbFSend(d, "change", …)` and `rbFSend(d, "min")`.

## Acceptance criteria

- `Date` instances answer `change` (as an instance method in AS core_ext/date/calculations), as Ruby's Date does.
- A test covers `DateTimeSelector` over a `Date` class instance with `discard_day`.

The private `d_lite_zero` readers and the `time_select` test were split out to `date-class-instance-d-lite-zero-private-readers`: seating them on `Date.prototype` flips I18n's `respond_to?(:sec)` date/time format choice.
