---
title: "Through-association scope raw-string joins dropped from join constraints"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 40
pr: 3950
claim: "2026-06-23T01:47:17Z"
assignee: "through-assoc-scope-string-join-sources"
blocked-by: null
---

## Context

PR #3729 (story `hasone-string-join-scope-invalid-sql`) wired an association
scope's raw-string `joins(...)` sources into the join constraints, but ONLY for
the single-step `has_one`/`has_many` join path
(`JoinDependency#addAssociation`, which captures `joinAssoc.joinSources` onto
the tree node's `scopeJoinSources`). See
`packages/activerecord/src/associations/join-dependency/join-association.ts`
(`joinConstraints`, the `joinSources` accumulator) and
`join-dependency.ts` (`addAssociation` captures it; `makeConstraints` emits it).

The through-association path `_addThroughViaJoinAssociation`
(`join-dependency.ts`) calls `joinAssoc.joinConstraints(...)` but does NOT read
back `joinAssoc.joinSources`, so a through association whose intermediate scope
contributes raw-string joins drops them entirely. Rails appends
`arel.join_sources` per chain step inside `chain.reverse_each`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency/join_association.rb:24-77`),
so each scope's string joins attach to their own chain step.

No current test exercises a through association with a string-join scope, so
this is latent, not a live regression.

## Acceptance criteria

- [ ] A `has_many ... through:` (or `has_one ... through:`) whose intermediate
      or source reflection scope contains a raw-string `joins(...)` emits that
      join source in the generated SQL via `Post.joins(:through_assoc)`.
- [ ] Join sources attach to the correct chain step (matching Rails' per-step
      `joins.concat arel.join_sources`), not all after the first join.
- [ ] A test mirroring a Rails through+string-join scope case, if one exists in
      the Rails suite; otherwise a trails-authored canonical test.
