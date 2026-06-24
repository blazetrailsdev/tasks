---
title: "Port ActiveSupport::Duration#+@ unary-plus + api:compare mapping"
status: claimed
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-06-24T11:30:40Z"
assignee: "activesupport-duration-unary-plus-operator"
blocked-by: null
---

## Context

While porting Ruby's unary-minus `-@` (PR #4054), the sibling unary-plus
operator `+@` surfaced as an unported api:compare miss on
`ActiveSupport::Duration` (`vendor/rails/activesupport/lib/active_support/duration.rb`
~line 326: `def +@; self; end`) and on `ActiveSupport::Duration::Scalar`.
`Duration#-@` was ported as `Duration#negate` and a global `-@`→`negate`
api:compare mapping was added; `+@` has no analog yet, so `duration.rb` still
reports it in the missing list (6 remaining: `coerce`, `+@`, `as_json`,
`_parts`, `raise_type_error`, `calculate_total_seconds`).

`+@` is trivial in Rails (`Duration#+@` returns `self`; `Scalar` has no `+@`).
The work: port the `+@` surface (e.g. a `unaryPlus()`/`identity` method or
decide the convention) and add the matching api:compare name mapping in
`scripts/api-compare/conventions.ts` (parallel to the `-@`→`negate` row), so
`api:compare --package activesupport` credits it instead of hunting an
impossible `+@` symbol.

## Acceptance criteria

- `ActiveSupport::Duration#+@` (and Scalar if applicable) has a TS surface.
- `scripts/api-compare/conventions.ts` maps Ruby `+@` to that method name
  (mirroring the existing `-@`→`negate` mapping), with a doc table row +
  regenerated `docs/ruby-ts-conventions.md`.
- `duration.rb` no longer lists `+@` as missing in api:compare.
