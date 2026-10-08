---
title: "Duration: <=> answers NaN for a non-Numeric operand where Rails answers nil; to_f answers an Integer value unchanged"
status: draft
updated: 2026-10-08
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Found while converging `Duration` onto a Float value in trails#8688
(`packages/activesupport/src/duration.ts`).

- `Duration#<=>` (`vendor/rails/v8.0.2/activesupport/lib/active_support/duration.rb:258-264`)
  has no `else`, so a non-Duration, non-Numeric operand answers `nil`. trails'
  `Duration#compareTo` answers `NaN` there and is typed `number`.
  `Scalar#compareTo` in the same file already answers `null`.
- `to_f` is delegated to `@value` (`duration.rb:224`), so it always answers a
  Float: `2.hours.to_f` is `7200.0`. trails' `Duration#toF` and `Scalar#toF`
  return `this.value` unchanged, an Integer for an Integer value. The Float
  seat is ruby-compat's boxed `Number` (`rbDbl2num`,
  `packages/ruby-compat/src/numeric.ts`), which trails#8688 made `Duration`
  carry through its operators.

## Acceptance criteria

- `Duration#compareTo` returns `null` for an operand that is neither a Duration
  nor a Numeric, typed `number | null`; callers that compared the result are
  updated.
- `Duration#toF` and `Scalar#toF` answer a Float for an Integer value, through
  ruby-compat's `toF` / `rbDbl2num`.
- Both pinned in `duration.trails.test.ts`.
