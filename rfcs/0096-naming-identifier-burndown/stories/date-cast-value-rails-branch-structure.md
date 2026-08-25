---
title: "date-cast-value-rails-branch-structure"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6528
claim: "2026-08-14T16:07:02Z"
assignee: "date-cast-value-rails-branch-structure"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/type/date.ts#castValue` (date.ts:53-55) ends with

```ts
const str = String(value).trim();
if (str === "") return null;
return this.fastStringToDate(str) ?? this.fallbackStringToDate(str);
```

Rails (`vendor/rails/activemodel/lib/active_model/type/date.rb:39-48`) branches
on the type instead, and never stringifies or trims:

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

So trails coerces every non-String, non-Temporal, non-Date input through
`String(value)` where Rails would have returned it untouched (the `else`
arm), and trims where Rails does not — `" "` is `empty?`-false in Ruby and
reaches `fast_string_to_date`, while trails turns it into `null`.

`packages/activemodel/src/type/date-time.ts#castValue` carries the identical
shape against `type/date_time.rb`.

This is an a3, not a rename — surfaced by RFC 0096 wave 3
(`naming-burndown-3-arel-activemodel`), where it keeps 4 `naming`
call-argument rows standing (2 in date.ts, 2 in date-time.ts): Rails passes
`value` to `fast_string_to_*`/`fallback_string_to_*`, trails passes the
derived `str`.

## Acceptance criteria

- [ ] `castValue` in both files carries Rails' branch structure — String arm,
      `to_date`/`to_time` arm, pass-through `else` arm — with no `String(value)`
      coercion and no `.trim()` that Rails does not do.
- [ ] The Temporal/`Date` boundary arms trails needs on top are justified at the
      call site against the Rails line they stand in for.
- [ ] `pnpm parity:api:calls:args:report` shows the 4 `naming` rows retired,
      with no new `shape` rows.
