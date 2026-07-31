---
title: "converge-build-join-buckets-single-joins-store"
status: claimed
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-31T18:32:54Z"
assignee: "converge-build-join-buckets-single-joins-store"
blocked-by: null
closed-reason: null
---

## Context

Carried out of `restore-rfc0072-verified-model-divergences` (RFC 0083), which
converged the other three RFC 0072 verified divergences and left this one
because it is a structural re-merge, not a call-site fix.

Rails `build_join_buckets`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1847-1850`)
pops the stashed eager `JoinDependency` out of `joins_values`:

```ruby
buckets[:join_node] = joins.pop if joins.last.is_a?(Arel::Nodes::Join)
...
if joins.last.base_klass == model
```

i.e. Rails keeps ONE store — `joins_values` — and discriminates the stashed
JoinDependency by comparing `base_klass` against `model`.

trails (`packages/activerecord/src/relation/query-methods.ts`, `buildJoinBuckets`)
keeps no JoinDependency in `joinsValues` at all. The eager stash lives in
`_eagerLoadAssociations` and cross-klass merged JoinDependencies live in
`_namedInnerJoinDeps`, so the `base_klass == model` discriminator is expressed
structurally (which store the JD came from) rather than by comparison. The
method therefore never reads `model` where Rails does.

Converging requires re-merging those three stores (`joinsValues`,
`_eagerLoadAssociations`, `_namedInnerJoinDeps`) into a single `joinsValues`
holding JoinDependency nodes, which touches construction, spawn/merge state
copying, and every reader of the two side stores.

## Acceptance criteria

- Inventory every producer and consumer of `_eagerLoadAssociations` and
  `_namedInnerJoinDeps` (file:line) before changing anything; if the re-merge
  exceeds the 500 LOC ceiling, split it into ordered follow-up stories rather
  than shipping a partial merge.
- `buildJoinBuckets` discriminates the stashed JoinDependency by
  `baseKlass === model`, matching query_methods.rb:1847-1850, reading from a
  single `joinsValues` store.
- Ported `joins` / `eagerLoad` / `merge` relation tests pass unchanged
  (no test renames).
- If the audit concludes the re-merge is not worth the churn, close the story
  with a written finding recording why, and re-register the divergence as a
  `Per-entry verified` note so it is not silently lost again.
