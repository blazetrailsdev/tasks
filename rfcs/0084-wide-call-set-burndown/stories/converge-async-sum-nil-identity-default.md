---
title: "async_sum's identity default is nil, not sum's 0"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 6460
claim: "2026-08-13T13:36:35Z"
assignee: "converge-async-sum-nil-identity-default"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6444 while converging `sum`'s identity default. Rails has two
different defaults for the same parameter
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:171,182`):

```ruby
def sum(initial_value_or_column = 0, &block)   # :171
  ...
end

def async_sum(identity_or_column = nil)        # :182
  async.sum(identity_or_column)
end
```

`async_sum` passes `nil`, not `0`, so `Model.async_sum` reaches
`calculate(:sum, nil)` -> `aggregate_column(nil)` -> `arel_column(nil)`, whose
`field.to_s` (query_methods.rb:1993) yields `""` and emits `SUM()` — invalid
SQL. `Model.sum` with the same absent argument emits `SUM(0)`.

trails' `Relation#asyncSum` (`packages/activerecord/src/relation.ts`) forwards
its optional parameter straight to `sum`, and a JS default parameter swallows an
explicitly-passed `undefined`, so an absent argument takes `sum`'s `0` — the
CLAUDE.md kwarg trap, here landing on the valid-SQL side. Rails has no test for
the no-argument `async_sum`, which is why the divergence is invisible.

## Converged shape

`asyncSum` distinguishes "no argument" from "0" the way Ruby's two distinct
defaults do, so `Model.asyncSum()` reproduces Rails' `nil` arm rather than
silently upgrading it to `0`. Confirm against MRI first (`ruby` is on PATH):
if `Person.async_sum` really does emit `SUM()` and raise, the converged answer
may be to mirror the raise, or to treat it as an upstream Rails bug and record
that determination with the reproduction — but not to leave the parameter
quietly rewritten.

## Acceptance criteria

- [ ] `asyncSum`'s absent-argument behaviour is derived from
      calculations.rb:182, not inherited from `sum`'s `= 0` default.
- [ ] The MRI behaviour of `Model.async_sum` (no argument) is recorded in the
      story or a test.
- [ ] `pnpm parity:api` delta non-negative.
