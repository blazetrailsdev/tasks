---
title: "blank?'s Time arm covers only JS Date, not Temporal"
status: done
updated: 2026-08-14
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6508
claim: "2026-08-14T03:57:08Z"
assignee: "drop-builder-association-scope-option-shim"
blocked-by: null
closed-reason: null
---

# `blank?`'s Time arm covers only JS `Date`, not trails' Temporal times

## Context

`vendor/rails/activesupport/lib/active_support/core_ext/object/blank.rb:182-184`
reopens `Time` so no Time is ever blank:

```ruby
class Time # :nodoc:
  def blank?
    false
  end
end
```

`packages/activesupport/src/core-ext/object/blank.ts` dispatches that arm on
`value instanceof Date` only (the `Time` class in that file is typed on `Date`).
trails' Time analogue is Temporal — `Temporal.ZonedDateTime` /
`Temporal.PlainDate` / `Temporal.Instant`, and `TimeWithZone`
(`packages/activesupport/src/time-with-zone.ts:93`). Such a value falls through
to the object arm, where `Object.keys(value).length === 0` reports it BLANK —
the opposite of blank.rb:182-184.

This predates PR #6499 (the pre-move `string-utils.ts#isBlank` had the same
hole); the move to the Rails path is what makes it visible against the .rb.

## Converged shape

The `Time` arm answers for every trails Time value — Temporal types and
`TimeWithZone` alongside `Date` — so `blank?` is `false` for all of them, as
blank.rb:182-184 says.

## Acceptance criteria

- [ ] `isBlank(Temporal.ZonedDateTime)`, `isBlank(Temporal.PlainDate)`,
      `isBlank(Temporal.Instant)` and `isBlank(TimeWithZone)` are all `false`.
- [ ] `isPresent` follows for the same values.
- [ ] `blank.test.ts` covers the Temporal arms; existing `Date` behavior unchanged.
