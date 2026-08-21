---
title: "Converge Ruby's receiver-form Enumerable#min against JS Math.min(...values)"
status: ready
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
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

# `count_records` passes `min` two arguments where Ruby's receiver form passes none

## Context

Baselined by PR #6825 as an `args` row in
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/has-many-association.json`.

Rails (`activerecord/lib/active_record/associations/has_many_association.rb:95`):

```ruby
[association_scope.limit_value, count].compact.min
```

`Enumerable#min` is a RECEIVER method taking no arguments. trails
(`packages/activerecord/src/associations/has-many-association.ts`) spells it
`Math.min(limitValue, count)`, so the call-argument gate sees two arguments
against Ruby's zero. Same values, same result — the divergence is spelling, not
behaviour.

The rest of that body was converged in #6825 (Rails' body inline, `select!` in
place via `selectBang`); this row is what is left.

## Converged shape

Either:

1. give `array-utils.ts` a receiver-shaped `min` next to the existing
   `selectBang` / `extractBang` primitives — Ruby core `Enumerable`, tagged
   `@noRailsEquivalent PERMANENT` exactly as `transformKeys` (hash-utils.ts) and
   `selectBang` are — so the ported body reads `min(compact([limitValue, count]))`
   and the gate credits the call; or
2. rule once, for the whole class of Ruby receiver-methods-with-no-arguments,
   that the `Math.*` spelling is a ratified language shape, and record that
   ruling somewhere better than a per-row `reason` string.

Option 1 is the convergence; option 2 is the fallback and needs a home, since
this row will recur for every ported `.min` / `.max` / `.sum`.

## Acceptance criteria

- [ ] The row is deleted from the exclude tree and the shard mark tightened, or
      the class-wide ruling is recorded and the row's reason points at it.
- [ ] `parity:api:calls:args` green.
