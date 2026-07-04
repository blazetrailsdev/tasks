---
title: "spawn-methods mergeBang plain-concats _joinValues instead of |= structural dedup"
status: ready
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`mergeBang` in `packages/activerecord/src/relation/spawn-methods.ts:124`
plain-concats `_joinValues` on merge:

```ts
this._joinValues.push(...(other._joinValues ?? []));
```

Rails' merge path unions with `relation.joins_values |= other.joins_values`
(`vendor/rails/activerecord/lib/active_record/relation/merger.rb:121`), which
dedups by `eql?`/`hash`. `Merger.mergeJoins` (`merger.ts`) was already converged
to structural dedup for `_joinValues` (via an `eql`/`===` check) — but the
sibling `spawn-methods.mergeBang` code path was NOT, so it still duplicates an
identical Arel join node (or repeated raw-SQL join string) when two relations
are merged through that path. A self-merge sharing the same join node yields a
duplicated join and ambiguous columns.

This was explicitly scoped out of PR #4537
(`left-outer-joins-values-structural-dedup`), which converged the Hash-spec
union sites (`_leftOuterJoinsValues` / `_namedInnerJoins`) but left the
raw-node/string `_joinValues` merge concat alone.

## Acceptance criteria

- `spawn-methods.mergeBang` dedups `_joinValues` by structural equality on merge,
  mirroring Rails `joins_values |= other.joins_values` — matching the existing
  `Merger.mergeJoins` treatment (reuse the same node-`eql`/`===` fold).
- Add a test: merging two relations that each carry an identical Arel inner-join
  node emits a single INNER JOIN (no duplicate).
- Audit `_joinClauses` in the same block for the analogous gap; converge or note
  why Rails does not dedup pre-resolved raw-SQL joins.

## Out of scope

- The Hash-spec union sites (already fixed in PR #4537).
