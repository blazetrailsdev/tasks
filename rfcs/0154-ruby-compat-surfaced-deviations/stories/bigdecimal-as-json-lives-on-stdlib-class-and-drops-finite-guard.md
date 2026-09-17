---
title: "BigDecimal#toJSON sits on the ruby-compat stdlib class, and ActiveSupport's as_json drops the finite? guard"
status: draft
updated: 2026-09-17
rfc: "0154-ruby-compat-surfaced-deviations"
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

trails#7853 moved `BigDecimal` into `packages/ruby-compat/src/big-decimal.ts` (Ruby stdlib, `vendor/ruby/ext/bigdecimal/bigdecimal.c`), but the stdlib class still carries `toJSON()` returning `toString("F")`. Ruby's stdlib has no JSON behaviour there: it is ActiveSupport's `BigDecimal#as_json` (`activesupport/lib/active_support/core_ext/object/json.rb:124-137`):

```ruby
def as_json(options = nil) # :nodoc:
  finite? ? to_s : nil
end
```

trails' port of that, `BigDecimal.asJson` in `packages/activesupport/src/core-ext/object/json.ts:74-78`, returns `value.toString()` with no `finite?` guard, so NaN/Infinity encode as `"NaN"` / `"Infinity"` where Rails gives `null`.

## Acceptance criteria

- `BigDecimal.asJson` in `core-ext/object/json.ts` is `isFinite() ? toString() : null`, mirroring `json.rb:134-136`.
- `toJSON` is removed from the ruby-compat class; JSON encoding of a BigDecimal reaches `as_json` through the ActiveSupport encoder / `ToJsonWithActiveSupportEncoder`, and `JSON.stringify(bd)` still yields the fixed-form string where ActiveSupport is loaded.
- Tests cover NaN and ±Infinity encoding to `null`.
