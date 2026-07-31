---
title: "Drop the trails-only manager.joinSourceCount routing guard from _applyJoinsToManager"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5753
claim: "2026-07-31T20:45:31Z"
assignee: "drop-apply-joins-manager-join-source-count-guard"
blocked-by: null
closed-reason: null
---

## Context

PR #5748 removed the `eagerJd` parameter from `_applyJoinsToManager`
(`packages/activerecord/src/relation.ts`), retiring the three trails-only
clauses it drove. One trails-only term survives in both routing guards: the
live `SelectManager` probe `manager.joinSourceCount > 0` (in `hasStashed`) and
`manager.joinSourceCount === 0` (in `pureLeftOuter`).

Rails' `build_join_buckets`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1824-1876`)
is a pure bucket-builder: it reads only `joins_values` and
`left_outer_joins_values` and never inspects a live manager, so
`stashed_eager_load || stashed_left_joins` is its entire routing guard. The
`joinSourceCount` probe has no analogue — it exists because the live path is
handed a manager that may already carry join sources (unlike the
`from(relation)` subquery half, `buildJoinBuckets`, which has no manager at
all). Determine whether any caller actually reaches `_applyJoinsToManager` with
a pre-populated manager; if not, drop both terms and let `_namedInnerJoins` /
`_leftOuterJoinsValues` / `_joinValues` decide routing exactly as Rails does.

## Acceptance criteria

- The `manager.joinSourceCount` terms are removed from `hasStashed` and
  `pureLeftOuter`, or the remaining caller that needs them is documented at the
  call site with its Rails counterpart.
- `_applyJoinsToManager`'s routing guards read only relation state, matching
  `build_join_buckets`.
- `relation/` suite, `calculations.test.ts` and `associations/eager.test.ts`
  pass unchanged (no test renames).
