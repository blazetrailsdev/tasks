---
title: "Split orderByPk's primary_key read to match Rails' two receivers"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5896
claim: "2026-08-02T17:39:26Z"
assignee: "converge-order-by-pk-receiver-split"
blocked-by: null
closed-reason: null
---

## Context

Deferred by #5894 (converge-relation-primary-key-delegate-reads), which
converged the reads whose Rails counterpart calls the bare `primary_key`
delegate but left the `model.primary_key` receivers untouched.

`packages/activerecord/src/relation/finder-methods.ts:466` `orderByPk` reads
`rel._modelClass.primaryKey`, bypassing the accessor. Its Rails counterpart is
`_order_columns` / `ordered_relation`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:641`
and `:654-655`), where the reads are `primary_key` (bare delegate, line 641)
and `model.primary_key` (line 655) respectively — two different receivers in
two different bodies. The trails helper collapses both into one `_modelClass`
read, so neither call is faithfully represented.

Same class as `project_export_let_to_accessor_exposes_wide_call_mismatches`:
value-identical at runtime, the win is call-graph fidelity.

## Acceptance criteria

- `orderByPk`'s read is split or routed so each Rails body's receiver is
  reproduced: bare `this.primaryKey` where Rails says `primary_key`
  (`finder_methods.rb:641`), `this.model.primaryKey` where Rails says
  `model.primary_key` (`finder_methods.rb:655`).
- If the two Rails bodies cannot share one trails helper, split the helper to
  match Rails' layout rather than picking one receiver for both.
- `pnpm parity:api:calls` stays green and the baseline does not grow.
- Behavior-preserving; existing finder/order tests keep their Rails names.
