---
title: "port-build-join-buckets-eager-stash-pop"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps:
  - converge-merged-join-deps-into-joins-values
  - converge-apply-join-dependency-joins-bang
deps-rfc: []
est-loc: null
priority: null
pr: 5765
claim: "2026-07-31T22:30:42Z"
assignee: "port-build-join-buckets-eager-stash-pop"
blocked-by: null
closed-reason: null
---

## Context

Step 3 of 3 — the payload — in the ordered split of
`converge-build-join-buckets-single-joins-store` (RFC 0083). Depends on step 1
(`converge-merged-join-deps-into-joins-values`) and step 2
(`converge-apply-join-dependency-joins-bang`), which together make `joinsValues`
the single store holding both cross-klass merged JoinDependencies and the eager
stash — the precondition that makes Rails' discriminator meaningful.

Rails `build_join_buckets`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1847-1850`):

```ruby
joins = joins_values.dup
if joins.last.is_a?(ActiveRecord::Associations::JoinDependency)
  stashed_eager_load = joins.pop if joins.last.base_klass == model
end
```

and the two downstream reads that depend on it: the leading-join routing at
`query_methods.rb:1856-1862` (`stashed_eager_load || stashed_left_joins`) and the
final `buckets[:stashed_join] << stashed_eager_load` at `query_methods.rb:1876`.

`base_klass == model` is what separates the eager JD (built on this relation's own
model) from a merged JD (built on another relation's model, which must stay in the
stream for `select_named_joins` to stash). Until steps 1 and 2 land, trails
expresses this structurally — by which side store the JD came from — so the method
never reads `model` where Rails does.

This was originally recorded as a `build_join_buckets` / `model` wide-gate exclude
entry, but PR #5728 deleted that entry as obsolete — `effectiveTsCalls` now sees
the `model` read through the same-file helper `constructJoinDependency`
(`relation/query-methods.ts:1741`), so the gate is satisfied even though the
fidelity divergence remains. Do NOT re-add it. The divergence's live wide-gate
anchor is instead the three `joins!` / `left_outer_joins!` entries re-bucketed as
verified by PR #5742, in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation.json`
(`apply_join_dependency`) and
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation/merger.json`
(`merge_joins`, `merge_outer_joins`).

## Scope

Port the pop literally and retire the divergence notes.

## Acceptance criteria

- `buildJoinBuckets` dups `joinsValues`, tests the last element for
  `instanceof JoinDependency`, and pops it into a local `stashedEagerLoad` only
  when `baseKlass === model` — matching `query_methods.rb:1847-1850`.
- `hasStashed` becomes `stashedEagerLoad || stashedLeftJoins` per
  `query_methods.rb:1858`, and `stashedEagerLoad` is appended to
  `buckets.stashed_join` last, per `query_methods.rb:1876`. Ordering matters:
  Rails appends it **after** `stashed_left_joins`.
- The three `joins!` / `left_outer_joins!` entries named above are DELETED once
  steps 1 and 2 have made those calls real — the calls are then genuinely made,
  so the exclusions are no longer warranted. Confirm with
  `pnpm parity:api --wide-calls` + `pnpm parity:api:calls` that none is
  re-required, and ratchet `scripts/api-compare/call-mismatches-wide-unreviewed.json`
  down if the unreviewed count drops.
- Ported `joins` / `eagerLoad` / `merge` relation tests pass unchanged (no test
  renames).
