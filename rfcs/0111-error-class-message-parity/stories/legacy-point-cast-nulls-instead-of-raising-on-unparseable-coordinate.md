---
title: "LegacyPoint#cast nulls out an unparseable coordinate where Rails' Kernel#Float raises"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while extracting `number_for_point` in PR #7219.

`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/legacy_point.rb:14-25`
casts through `Kernel#Float`, which RAISES `ArgumentError` on an unparseable
coordinate, and strips the surrounding parens by index:

```ruby
def cast(value)
  case value
  when ::String
    if value.start_with?("(") && value.end_with?(")")
      value = value[1...-1]
    end
    cast(value.split(","))
  when ::Array
    value.map { |v| Float(v) }
  else
    value
  end
end
```

trails `packages/activerecord/src/connection-adapters/postgresql/oid/legacy-point.ts`
instead routes the String arm through a trails-only `parsePoint` helper that
strips parens with a global `/[()]/g` replace, `parseFloat`s each half, and
returns `null` when either side is `NaN` — so a malformed point silently
becomes `null` where Rails raises, and the `else` arm returns `null` rather
than the value unchanged.

This is the `legacy-point.ts` sibling of
[[converge-pg-oid-point-build-point-float]], which tracks the same
`Kernel#Float`-raises-vs-nulls divergence in `point.ts`'s `build_point`. That
story's `story_paths` names only `point.ts`, so this file is not covered by it.

## Converged shape

- `cast` mirrors Rails' three-arm `case` directly: the String arm strips the
  parens only when the value both starts with `(` and ends with `)`, by index
  (`value.slice(1, -1)`), then recurses on `value.split(",")`; the Array arm
  maps each element through the repo's `Kernel#Float` analogue; the else arm
  returns `value` unchanged.
- `parsePoint` goes away with the branch it served — it is a trails-only
  helper Rails does not have.
- Reuse whatever `Kernel#Float` analogue [[converge-pg-oid-point-build-point-float]]
  and [[consolidate-kernel-integer-and-float-conversions]] settle on; do not
  introduce a second spelling.

## Acceptance criteria

- [ ] `LegacyPoint#cast` mirrors `legacy_point.rb:14-25` arm for arm, raising
      on an unparseable coordinate rather than returning `null`.
- [ ] The `parsePoint` helper is deleted, not re-justified.
- [ ] Rails' legacy point test cases pass on the PostgreSQL lane.
