---
title: "Enum assertValidValue not enforced on mass-assignment/writeAttribute"
status: draft
updated: 2026-06-12
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while porting `adapters/postgresql/enum_test.rb` (PR #3160,
story `p3-pg-enum-orm-and-schema`).

PR #3160 wired `EnumType.assertValidValue` into the `_enum` property setter so
`record.current_mood = "angry"` raises `ArgumentError`. But Rails enforces enum
validity through the full `write_from_user` attribute chain, so **all**
assignment paths raise — including mass-assignment and `write_attribute`:

```rb
PostgresqlEnum.new(current_mood: "angry")  # Rails raises ArgumentError
```

In our port, validation lives only on the prototype property setter
(`enum.ts`, the `set(value)` defined in `_enum`). Paths that bypass that
setter — `new Model({ current_mood: "angry" })`, `assignAttributes`, and
`writeAttribute("current_mood", "angry")` — do **not** raise. This is a
behavioral deviation from Rails.

The faithful fix routes `assertValidValue` through `writeAttribute`/the
attribute type's user-assignment cast (so every assignment path validates),
rather than only the property setter. Confirm against
`active_record/enum.rb` (`EnumType#assert_valid_value`) and the
`ActiveModel::Attribute::FromUser` chain.

## Acceptance criteria

- [ ] Invalid enum mass-assignment (`new Model({ enum: "bad" })`) raises `ArgumentError`.
- [ ] Invalid `writeAttribute` on an enum attribute raises `ArgumentError`.
- [ ] Existing valid-assignment and nil-assignment enum tests still pass.
- [ ] api:compare and test:compare deltas non-negative.
