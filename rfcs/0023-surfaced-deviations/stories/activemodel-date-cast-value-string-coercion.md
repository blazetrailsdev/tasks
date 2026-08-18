---
title: "activemodel-date-cast-value-string-coercion"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: neither type/date.ts nor type/date-time.ts builds a String(value).trim() local any more. date.ts:61 is date.rb:38-46's branch shape (String -> empty check -> fastStringToDate ?? fallbackStringToDate; PlainDate/PlainDateTime/Date conversions; else passthrough) and date-time.ts:56 is the same for date_time.rb, both passing value through unmodified. No .trim() remains in either file."
---

## Context

Surfaced by RFC 0096 wave 2 (`naming-burndown-2-arel-activemodel`). Four
`naming` call-argument rows in `packages/activemodel/src/type/date.ts` and
`packages/activemodel/src/type/date-time.ts` are not identifier renames — the
TS `castValue` bodies build a `String(value).trim()` local Rails does not have
(an a3 finding), and the `.trim()` is a live behavioral divergence.

`vendor/rails/activemodel/lib/active_model/type/date.rb:38-46`:

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

`vendor/rails/activemodel/lib/active_model/type/date_time.rb:53-58` is the same
shape for `fast_string_to_time` / `fallback_string_to_time`.

Rails guards on `value.is_a?(::String)` and passes `value` **unmodified**.
trails (`packages/activemodel/src/type/date.ts:53-55`,
`packages/activemodel/src/type/date-time.ts:44-46`) instead does:

```ts
const str = String(value).trim();
if (str === "") return null;
return this.fastStringToDate(str) ?? this.fallbackStringToDate(str);
```

Two divergences:

1. `String(value)` replaces Rails' `is_a?(::String)` type guard — a non-String,
   non-`to_date` value reaches the string parsers instead of falling through to
   the `else value` arm.
2. `.trim()` has no Rails counterpart. Rails' `" "` is not `empty?`, so it goes
   to `fast_string_to_date(" ")` → nil → `fallback_string_to_date(" ")`;
   trails short-circuits to `null`. Confirm against MRI (`ruby` is on PATH)
   before changing, and check whether `Date._parse(" ")` differs from our port.

Rows: `castValue -> fast_string_to_date`, `castValue -> fallback_string_to_date`,
and the two `_to_time` twins — all `RB [ref:value]` vs `TS [ref:str]`.

Not in scope here (separate extractor artifacts, left standing deliberately):
`fastStringToDate -> new_date` (`ref:toI` vs `ref:parseInt`) and
`valueFromMultiparameterAssignment -> new_date` (`ref:mon`/`ref:mday` vs
Temporal's `.month`/`.day` property names).

## Acceptance criteria

- [ ] `castValue` in both files dispatches on the Rails branch shape
      (String → empty check → fast/fallback; `to_date`/`to_time`-able → convert;
      else passthrough) and passes `value` through unmodified.
- [ ] The `.trim()` is removed, or kept with a `ruby`-verified citation showing
      MRI reaches the same result for whitespace-only input.
- [ ] The four `naming` rows disappear from `pnpm parity:api:calls:args:report`;
      no new `shape` rows.
- [ ] `pnpm vitest run packages/activemodel/src/type` passes, plus the AR type
      tests that exercise date/datetime casting.
