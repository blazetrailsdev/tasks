---
title: "converge-grouped-calculation-arms-onto-relation-arel"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6448
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`execute_grouped_calculation` (`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:512-557`)
rebases with `except(:group).distinct!(false)`, resolves the group fields via
`relation.arel_columns`, then assigns `relation.group_values = group_fields` and
`relation.select_values = select_values` and selects through `relation.arel`
(`:552-557`).

trails' grouped arms — `groupedAggregate` and `groupedCompositeAssoc` in
`packages/activerecord/src/relation/calculations.ts` (~`:340-560`) — still build
a `SelectManager` by hand: `table.project(...)` followed by
`_applyJoinsToManager`, `_applyWheresToManager`, `applyFromToManager`,
`manager.group(...)`, `foldSelectValuesForHaving`, `applyHavingToManager`,
`_applyOrderToManager` and hand-applied `take`/`skip`.

PR #6448 converged the UNGROUPED arm onto `relation.arel` and switched both
grouped arms to `aggregate_column` + `operation_over_aggregate_column`
(`:537-538`), but left the manager construction — it is a separate, larger
change (the group aliases, the `group_aliases`/`group_columns` zip, the
belongs_to key-record lookup and the SQLite bigint CAST wrapper all read the
hand-built aliases).

## Acceptance criteria

- [ ] `groupedAggregate` / `groupedCompositeAssoc` rebase with
      `except("group").distinctBang(false)`, assign the relation's group values
      and select values, and compile `relation.arel` — no hand-applied
      joins/wheres/from/having/order/limit.
- [ ] The bigint CAST wrapper and the belongs_to key-record path keep working
      (`calculations.test.ts`, `calculations.trails.test.ts` stay green).
- [ ] Any call-mismatch baseline rows that converge as a result are deleted by
      hand (only-shrink).
