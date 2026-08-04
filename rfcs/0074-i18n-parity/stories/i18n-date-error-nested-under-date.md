---
title: "Raise Date::Error rather than bare ArgumentError from Date.parse"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6069
claim: "2026-08-04T16:04:09Z"
assignee: "i18n-date-error-nested-under-date"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/date.ts` `Date.parse` raises `ArgumentError("invalid date")`
where Ruby raises `Date::Error`, a class nested under `::Date` that subclasses
`ArgumentError` (ruby/date `date_core.c`, `eDateError`). The call site carries a
comment saying a nested TS class cannot be spelled and the superclass is what
callers rescue.

That justification is weaker than it looks: TypeScript can express the nesting
with declaration merging — a `class DateError extends ArgumentError` plus a
`namespace Date { export { DateError as Error } }`, or a static field
`static Error = DateError` on the class. Callers rescuing `ArgumentError` keep
working either way, because `Date::Error` is a subclass of it in Ruby too.

Ruby reference: `date_core.c` `eDateError` / `Init_date_core`, raised from
`d_new_by_frags` and `date_s_parse`.

## Converged shape

Define the error class at `Date.Error`, subclassing `ArgumentError`, and raise
it from `Date.parse` (and any later `::Date` member that raises it). Remove the
call-site comment that ratifies `ArgumentError`.

## Acceptance criteria

- `Date.parse("not a date")` raises `Date.Error`, and that error is an
  `instanceof ArgumentError`.
- The message stays `"invalid date"`.
- The deviation comment at the raise site is deleted, not reworded.
