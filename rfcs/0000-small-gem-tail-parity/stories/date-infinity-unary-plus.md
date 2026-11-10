---
title: "Close Date::Infinity#+@ with the unary-plus scoped skip Duration already has"
status: draft
updated: 2026-11-09
rfc: "0000-small-gem-tail-parity"
cluster: null
packages:
  - "date"
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` (2026-11-09) date 9/10: `Date::Infinity#+@`
(`vendor/date/v3.4.1/lib/date.rb:33`, `def +@() self.class.new(+d) end`). Its
siblings `-@`, `<=>` and `coerce` landed with `port-date-infinity-from-lib-date-rb`.
In trails' `scripts/parity/conventions.ts`, `-@` translates to `negate`
(:1845), but `+@` has no translation. `+@` has one scoped skip, for
`duration.rb` (:1012-1023): TS has no syntax that dispatches `+x` to a named
method (unary `+` coerces through `valueOf()`), so a ported method is
unreachable. `Date::Infinity#+@` is the same operator in the same situation, and
nothing in `date.rb` calls it by name.

## Acceptance criteria

- [ ] The existing `+@` scoped skip's `rubyFiles` gains date's `date.rb`, and
      its reason names both sites. No new skip entry is added.
- [ ] `pnpm parity:api` reports date 10/10.
