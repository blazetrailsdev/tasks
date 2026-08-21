---
title: "Duration#equals' non-Duration arm uses === where Ruby sends =="
status: claimed
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-08-21T02:10:29Z"
assignee: "converge-duration-equals-non-duration-arm-to-a-ruby-send"
blocked-by: null
closed-reason: null
---

## Context

PR #6799 ported `ActiveSupport::Duration#==`
(`vendor/rails/activesupport/lib/active_support/duration.rb:341-347`):

```ruby
def ==(other)
  if Duration === other
    other.value == value
  else
    other == value
  end
end
```

as `Duration#equals` in `packages/activesupport/src/duration.ts`. The
non-Duration arm is spelled `other === this.value` — a JS identity/primitive
comparison, where Ruby's `other == value` is a SEND to `other`.

They differ for any receiver that defines its own `==` against a numeric:
`duration.ts`'s own `Scalar` wrapper is the in-repo instance (`Scalar#==`
delegates to its `value`), and Ruby also answers true for
`Rational(172800, 1) == 172800`. `2.days.equals(new Scalar(172800))` is `false`
in trails and `true` in Ruby.

This is the same `rb_equal` dispatch `range-ext.ts` already models in its
private `rbEqual` helper (identity, then an `equals()` send), which
`Error#optionsEqual` also uses.

## Converged shape

The else arm dispatches like a Ruby `==` send: identity, then the receiver's
own `equals()` when it defines one, falling back to `===`. Reuse the existing
`rbEqual` shape rather than adding a third copy of it — if it needs to be
shared, it belongs somewhere both `range-ext.ts` and `duration.ts` can reach.

## Acceptance criteria

- [ ] `2.days.equals(new Scalar(172800))` is true, mirroring `2.days == other`
      where `other` answers `==`.
- [ ] `2.days.equals(172800)` stays true and `2.days.equals("foo")` stays false
      (`duration_test.rb:38-43`, ported as `DurationTest > equals`).
- [ ] No fourth copy of the `rb_equal` dispatch.
- [ ] Regression test fails on the pre-change baseline.
