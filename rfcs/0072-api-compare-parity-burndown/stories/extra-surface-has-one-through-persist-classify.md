---
title: "extra-surface: classify has-one-through-association.ts's residual persistReplace / persistThroughRecord"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6141
claim: "2026-08-05T20:33:08Z"
assignee: "mysql-schema-creation-memoizes-where-rails-allocates"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `extra-surface-has-one-base-build-hooks-classify`
(PR #5946), which dropped `has-one-through-association.ts` from 4 novel
extras to 2 by narrowing the two inherited hooks it overrides
(`loadTargetForBuild`, `detachDisplacedTarget`) to `protected` on the base.

`pnpm build && pnpm parity:api && pnpm parity:api:extra --package activerecord
--novel-only` now reports on
`packages/activerecord/src/associations/has-one-through-association.ts`:

```text
persistReplace  persistThroughRecord
```

Neither exists in
`vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb`,
which declares only `replace`, `create_through_record` and `find_target`.

These two are the residue the earlier `extra-surface-has-one-through-classify`
story (done) deliberately left counted — it classified 5 of the file's extras
and left this pair, and PR #5946 removed the other 2 it had left. They are the
awaitable persist halves of Rails' synchronous `HasOneThroughAssociation#replace`
/ `create_through_record` (has_one_through_association.rb:9-40), split out so
the JS writer can `await` the join-row create/update/destroy.

Note the precedent set by #5946: check each name's BODY before bucketing it.
One of that PR's four (`needsTargetLoadForBuild`) turned out to be a zero-value
alias of a method already ported under its Rails name (`findTargetNeeded` =
`find_target?`) and was deleted outright rather than narrowed. Do NOT rename
survivors onto Rails names to look aligned — a Rails name on a method that is
not that Rails method is worse than an honest invented one, and check first
whether the Rails name is already taken by the real port.

## Acceptance criteria

- Each of `persistReplace` and `persistThroughRecord` is classified as
  (a) invention to delete, (b) faithful internal that can be made
  `protected`/`#` (call sites converged), or (c) misplaced port to
  relocate + rename onto its Rails name.
- Convergeable names are actioned, not tagged `@noRailsEquivalent CONVERGEABLE`.
- `pnpm parity:api:extra --package activerecord --novel-only` shows
  `associations/has-one-through-association.ts` dropping by the number of
  names actioned; record before/after in the PR body.
- has_one_through association tests pass with no test renames.
