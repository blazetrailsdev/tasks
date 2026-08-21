---
title: "Port Duration#== so Error option values compare by value"
status: claimed
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: "2026-08-21T00:17:06Z"
assignee: "converge-date-type-cast-for-schema-to-rails"
blocked-by: null
closed-reason: null
---

## Context

`Error#optionsEqual` (`packages/activemodel/src/error.ts`) stands in for Ruby
`==`, which `error.rb` depends on at three sites: `match?` compares option
values with `!=` (`vendor/rails/activemodel/lib/active_model/error.rb:171`),
`strict_match?` compares whole hashes with `==` (`:187`), and `==` compares the
`attributes_for_hash` arrays elementwise (`:190-192`). Its last arm sends `==`
— an object's own `equals()` if it defines one, otherwise identity.

PR #6792 gave `Range` an `equals()` (range.c `range_eq`) so that
`validates_length_of :name, in: 5..20`'s option value compares by value.
`ActiveSupport::Duration` is the remaining shape with the same problem: it has
no `equals()` in `packages/activesupport/src/duration.ts`, so two separately
built but equal durations land on the identity arm and `match` answers `false`
where Ruby answers `true`. Rails' comparison validators accept a Duration
(`greater_than: 2.days`), so this is a shape Rails itself produces.

Rails source: `vendor/rails/activesupport/lib/active_support/duration.rb:341-347`

    def ==(other)
      if Duration === other
        other.value == value
      else
        other == value
      end
    end

Note the non-Duration arm compares against the raw `value` (seconds), so
`2.days == 172800` is true — both arms must be ported, not just the
Duration-to-Duration one.

## Converged shape

`Duration#equals(other)` mirroring duration.rb:341-347, both arms. It needs no
change in `error.ts`: `optionsEqual`'s existing dispatch already looks for
`equals()`, which is the whole reason the shim was shaped that way in #6780.

## Acceptance criteria

- Two separately-constructed equal `Duration`s compare equal through
  `Error#match`, `#strictMatch` and `#equals`.
- `2.days.equals(172800)` is true (the `other == value` arm).
- Regression test fails on the pre-change baseline.
- `pnpm parity:api:extra --package activesupport` shows no new novel name
  (`==` maps through the operator table, as `Range#equals` does).
