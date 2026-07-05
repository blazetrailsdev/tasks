---
title: "belongs-to-composite-fk-stale-state-rails-convergence"
status: draft
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Flagged during review of PR #4620 (BigInt normalization in
`BelongsToAssociation#staleState`). The BigInt fix is correct within trails'
existing composite-FK branch, but that branch itself is a deviation from Rails
predating the PR.

Rails' `stale_state`
(`vendor/rails/activerecord/lib/active_record/associations/belongs_to_association.rb:164-166`):

```ruby
def stale_state
  owner._read_attribute(reflection.foreign_key) { |n| owner.send(:missing_attribute, n, caller) }
end
```

No array/scalar branching, no `JSON.stringify`. `_read_attribute`
(`activerecord/lib/active_record/attribute_methods/read.rb:38`) →
`@attributes.fetch_value(name)` → `self[name].value` (`attribute_set.rb:50-52`).
When `reflection.foreign_key` is an Array (composite / query_constraints FK),
`self[array]` matches no stored attribute, so Rails' composite `stale_state`
resolves to the missing-attribute path (nil / raise), NOT a real composite
value.

trails instead (`packages/activerecord/src/associations/belongs-to-association.ts:211`)
maps each FK component and returns `JSON.stringify(values)` — a trails-invented
composite key shape with no Rails counterpart.

## Acceptance criteria

- [ ] Determine Rails' actual composite-FK `stale_state` behavior empirically
      (does it return nil, or does some composite-PK override give it a real
      value?) and converge trails to match — either drop the composite branch
      or back it with a Rails override if one exists.
- [ ] `stale_target?` semantics for composite-FK belongs_to match Rails
      (reload-on-FK-change behavior preserved or corrected per Rails).
- [ ] Update/replace the BigInt composite-FK regression test from PR #4620
      (`belongs-to-stale-state-bigint-composite-fk.test.ts`) to reflect the
      converged behavior.
- [ ] If Rails genuinely returns nil for composite `stale_state`, document the
      trade-off (staleness never fires for composite belongs_to) or find the
      override that avoids it.
