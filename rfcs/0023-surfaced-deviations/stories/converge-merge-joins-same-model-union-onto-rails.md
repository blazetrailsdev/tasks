---
title: "Converge mergeJoins same-model branch onto Rails plain joins_values union"
status: draft
updated: 2026-08-01
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `merge_joins` / `merge_outer_joins` same-model branch is a single line
(`vendor/rails/activerecord/lib/active_record/relation/merger.rb:121`, `:140`):

```ruby
relation.joins_values |= other.joins_values
relation.left_outer_joins_values |= other.left_outer_joins_values
```

trails' `Merger#mergeJoins` (`packages/activerecord/src/relation/merger.ts:100-120`,
post-#5766) instead branches on `other._isNamedJoinValue(v)` and dedups named specs
against `rel._namedInnerJoins` while deduping raw values against `rel._joinValues` —
three trails-only fields with no Rails counterpart. `mergeOuterJoins` is already a
plain structural union, so only the inner-join side deviates.

This split predates #5766 (carried verbatim from the deleted
`relation/merge-joins.ts`) and was explicitly left out of that story's scope. It is
entangled with `fold-join-clauses-into-joins-values`, which covers the adjacent
`_joinClauses` side-channel.

## Acceptance criteria

- The same-model branch of `mergeJoins` reduces to the same structural union Rails
  performs, against a single joins-values field, OR the surviving `_namedInnerJoins`
  / `_joinValues` reads are justified at the call site with the trails invariant that
  requires them.
- `relation/merging.test.ts`, `relations.test.ts`, and `associations/eager.test.ts`
  pass unchanged (no test renames).
- `pnpm parity:api:calls` does not regress; ratchet down if the unreviewed count drops.
