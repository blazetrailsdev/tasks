---
title: "A1b — eager_test: conditions/order/select/limit on joined tables"
status: in-progress
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: 3928
claim: "2026-06-22T21:31:16Z"
assignee: "a1-eager-joined-table-conditions-order"
blocked-by: null
---

## Context

Split off from `a1-eager-preloader-semantics` (RFC 0030). eager_test.rb cases for **eager_load with conditions/order/select on a joined table, limits + conditions on the eagers, default-scope association conditions, and join-driven preload** (`joins(:x).includes(:x)` collapsing to one query). `associations/eager.ts` / `preloader.ts` lack these. Faithful port against canonical Post/Author/Comment/Tagging/Tag models + fixtures.

Rails: vendor/rails/activerecord/test/cases/associations/eager_test.rb.

### Tests to un-skip

- eager loading with order on joined table preloads
- eager loading with conditions on joined table preloads
- eager loading with select on joined table preloads
- eager loading with conditions on join model preloads
- order on join table with include and limit
- eager with has many and limit and conditions on the eagers
- eager with has many and limit and scoped conditions on the eagers
- preload has many with association condition and default scope
- joins with includes should preload via joins

## Acceptance criteria

- [ ] Each listed test un-skipped and passing (canonical models/fixtures, Rails-faithful) or reclassified permanent-skip with reason.
- [ ] No new gate-mismatches.
