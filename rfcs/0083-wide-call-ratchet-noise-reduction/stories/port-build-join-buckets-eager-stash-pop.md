---
title: "port-build-join-buckets-eager-stash-pop"
status: ready
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
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
never reads `model` where Rails does. That is the RFC 0072 verified divergence
recorded in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation/query-methods.json`
(`build_join_buckets` / `model`).

## Scope

Port the pop literally and retire the divergence note.

## Acceptance criteria

- `buildJoinBuckets` dups `joinsValues`, tests the last element for
  `instanceof JoinDependency`, and pops it into a local `stashedEagerLoad` only
  when `baseKlass === model` — matching query_methods.rb:1847-1850.
- `hasStashed` becomes `stashedEagerLoad || stashedLeftJoins` per
  query*methods.rb:1858, and `stashedEagerLoad` is appended to
  `buckets.stashed_join` last, per query_methods.rb:1876 (ordering matters: Rails
  appends it \_after* `stashed_left_joins`).
- The `build_join_buckets` / `model` entry is DELETED from
  `scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation/query-methods.json`
  — the call is now genuinely made, so the wide-gate exclusion is no longer
  warranted. Confirm with `pnpm api:compare` that the entry is not re-required.
- Ported `joins` / `eagerLoad` / `merge` relation tests pass unchanged (no test
  renames).
