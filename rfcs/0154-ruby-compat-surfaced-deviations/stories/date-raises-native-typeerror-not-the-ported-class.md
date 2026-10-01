---
title: "date: raise ruby-compat's TypeError, so new_date can rescue StandardError alone"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/date/src/date.ts` and `time.ts` raise the JS global `TypeError` where the
date gem raises Ruby's `TypeError` (`rb_eTypeError`): `date.ts:577,580,4105,4126,4296,4408,4478,5721,5763,6560,6602`
and `time.ts:158,1530`. For example `check_numeric`
(`vendor/ruby/v3.3.11/ext/date/date_core.c`, called from `date_initialize` at `:3518-3524`) is
`checkNumeric` at `date.ts:4408`.

The ported class already exists: `TypeError` in `packages/ruby-compat/src/type-error.ts`, which extends
`StandardError` so a Ruby `rescue` can catch it by class. Because date raises the native one, a caller
cannot tell a Ruby `TypeError` from a JS runtime fault.

Surfaced by trails#8333: `ActiveModel::Type::Date#new_date`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/type/date.rb:66-70`, `::Date.new(year, mon, mday) rescue nil`)
has to rescue `StandardError || TypeError` (native) at `packages/activemodel/src/type/date.ts:98`, which also
swallows a genuine JS `TypeError` thrown inside `Date.new`.

## Converged shape

`date.ts` / `time.ts` import `TypeError` from `@blazetrails/ruby-compat` (the import shadows the global, which
`blazetrails/rails-error-parity` accepts), and `new_date`'s rescue becomes `error instanceof StandardError` alone.

## Acceptance criteria

- [ ] Every Ruby-`TypeError` raise site in `packages/date/src` constructs ruby-compat's `TypeError`.
- [ ] `packages/activemodel/src/type/date.ts` `newDate` rescues `StandardError` only; a native `TypeError` propagates, with a test.
- [ ] Date-package tests that assert `toThrow(TypeError)` name the ported class.
