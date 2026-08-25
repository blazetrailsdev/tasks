---
title: "Move sum/calculate to calculations.rb's source order in relation/calculations.ts"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6599
claim: "2026-08-16T15:15:06Z"
assignee: "collection-proxy-delegate-query-method-bangs-to-scope"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/relation/calculations.rb` defines
its public members in this order:

```text
count          :94     async_count    :108
average        :116    async_average  :122
minimum        :131    async_minimum  :137
maximum        :146    async_maximum  :152
sum            :172    async_sum      :182
calculate      :217
pluck          :291    async_pluck    :334
pick           :352    async_pick     :363
ids            :371    async_ids      :409
```

`packages/activerecord/src/relation/calculations.ts` currently orders the
aggregate group differently:

```text
performCount / asyncCount
calculate                  <- Rails puts this AFTER sum, at :217
performSum / asyncSum      <- Rails puts sum AFTER maximum, at :172
performAverage / asyncAverage
performMinimum / asyncMinimum
performMaximum / asyncMaximum
pluck / asyncPluck, pick / asyncPick, ids / asyncIds   <- already correct
```

PR #6597 (fan-out-calculations-from-relation) fixed the tail — `pluck`, `pick`,
`ids` and every `async*` twin now sit exactly where calculations.rb has them,
each `async_*` adjacent to its sync twin. The `calculate` / `sum` placement is
older drift that predates that PR and was explicitly left alone as out of
scope.

Two members need to move to converge:

- `sum` (and its adjacent `asyncSum`) moves DOWN, to sit after `maximum` —
  Rails order is `count, average, minimum, maximum, sum` (:94, :116, :131,
  :146, :172).
- `calculate` moves DOWN, to sit after `sum` and before `pluck` (:217).

Note the `blazetrailsdev/rails-file-structure-method-order` lint rule enforces
Rails source order but is currently scoped to `arel` and `activemodel`
(CLAUDE.md, "Before you open the PR" step 4), so `activerecord` order is not
gated — this is a manual convergence.

## Acceptance criteria

- [ ] `performSum`/`asyncSum` and `calculate` are repositioned so top-level
      member order in `relation/calculations.ts` matches calculations.rb's
      source order for the whole public group.
- [ ] Pure reordering: no body, signature, or export changes; the
      `Calculations` module object's key order matches the new source order
      too.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative;
      `pnpm parity:api:calls` / `:args` green with no new or changed baseline
      rows.
