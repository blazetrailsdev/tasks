---
title: "Type::Date#cast_value's middle arm is a closed instanceof list, not Rails' respond_to?(:to_date)"
status: draft
updated: 2026-09-16
rfc: "0155-assertion-surfaced-port-bugs"
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

`ActiveModel::Type::Date#cast_value`'s middle arm is duck-typed
(`vendor/rails/activemodel/lib/active_model/type/date.rb:39-48`):

```ruby
def cast_value(value)
  if value.is_a?(::String)
    return if value.empty?
    fast_string_to_date(value) || fallback_string_to_date(value)
  elsif value.respond_to?(:to_date)
    value.to_date
  else
    value
  end
end
```

`value.respond_to?(:to_date)` catches every value that can become a Date —
`Time`, `DateTime`, `ActiveSupport::TimeWithZone`, `Date` itself.

trails (`packages/activemodel/src/type/date.ts:44-63`) replaced that one arm
with a closed list of three `instanceof` checks —
`Temporal.PlainDate`, `Temporal.PlainDateTime`, JS `Date` — so a value that
has `toDate` but is none of those falls through to the `else` and is returned
**uncast**. `Time` from `@blazetrails/date` is exactly that case: it carries
`toDate` on its prototype and is not matched by any arm.

Measured while porting `attribute_methods_test.rb`'s
`write time to date attribute` (`:748-754`), whose Rails body is:

```ruby
in_time_zone "Pacific Time (US & Canada)" do
  record = @target.new
  record.last_read = Time.utc(2010, 1, 1, 10)
  assert_equal Date.civil(2010, 1, 1), record.last_read
end
```

`topics.last_read` is a `date` column. In trails, `record.last_read` after that
write is a `Time`, not a date — its prototype is the `Time` one
(`year,mon,month,day,mday,…,toDate,…`). The port therefore has to assert
`[lastRead.year, lastRead.mon, lastRead.mday]` instead of comparing against a
Date, which is a live divergence at an `assert_equal` Rails makes directly.

Note the prior convergence `date-cast-value-coerces-instead-of-branching`
(RFC 0113, `trails#7268`) is what introduced the three-arm structure; it fixed
the string-coercion bug but narrowed Rails' duck-typed arm into an instanceof
list. This story finishes that convergence.

## Converged shape

The middle arm tests for the method, not for a class — the trails idiom for
Ruby `respond_to?` is `rbObjRespondTo` (CLAUDE.md; see
`packages/ruby-compat/src/object.ts`):

```ts
} else if (rbObjRespondTo(value, "toDate")) {
  return (value as { toDate(): DateCastResult }).toDate();
} else {
  return value as DateCastResult;
}
```

which subsumes the `Temporal.PlainDateTime` and JS `Date` arms if those types
carry `toDate`; keep an explicit arm only where they do not, and keep
`Temporal.PlainDate`'s identity return if `toDate` is absent there.

## Acceptance criteria

- `castValue`'s middle arm is the duck-typed `respond_to?(:to_date)` check,
  matching `date.rb:43-44`, so a `Time` assigned to a `date` attribute casts to
  a date.
- `attribute_methods_test.rb`'s `write time to date attribute` in
  `packages/activerecord/src/attribute-methods.test.ts` asserts the cast value
  against a Date, as Rails' single `assert_equal Date.civil(2010, 1, 1),
record.last_read` does, instead of the `[year, mon, mday]` triple.
- `pnpm parity:test -- --package activerecord --assertions` and
  `pnpm parity:api:calls` do not regress.
