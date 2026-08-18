---
title: "Strip the leading colon in Preloader::Branch, unblocking the includes/preload sweep"
status: done
updated: 2026-08-18
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6713
claim: "2026-08-18T19:23:13Z"
assignee: "converge-includes-preload-colon-sweep-associations-eager-test"
blocked-by: null
closed-reason: null
---

## Context

Enabling step for the `sweep-includes-preload-call-sites-onto-the-colon-symbol-spelling`
sweep, which is too large to land as one PR (~800 literal call sites across 131
files in `packages/activerecord/src`).

`joins` / `leftOuterJoins` already accept the colon Symbol spelling because
`JoinDependency.walkTree` strips the leading colon at
`packages/activerecord/src/associations/join-dependency.ts:933` (scalar) and
`:952` (hash key), mirroring `join_dependency.rb:55-56` and `:61-64` where a
Symbol and the equivalent String key the same node.

The preload path has no such strip. `Preloader::Branch#initialize` coerces the
name with `association.to_sym` (`vendor/rails/activerecord/lib/active_record/associations/preloader/branch.rb:11-18`);
trails ports that as `Branch#_normalizeAssociationName`
(`packages/activerecord/src/associations/preloader/branch.ts:304-320`), which
passes a string through unchanged. So `includes(":comments")` reaches the
reflection lookup as `":comments"` and misses.

## Converged shape

`_normalizeAssociationName` strips a leading colon from the string arm, exactly
as `join-dependency.ts:933` already does — one strip site, at the entry point,
not new normalization scattered through `Branch`.

With that in place the call-site clusters can be swept independently:

- `converge-includes-preload-colon-sweep-relation-and-preloader` (~120 sites)
- `converge-includes-preload-colon-sweep-src-top-level` (~240 sites)
- `converge-includes-preload-colon-sweep-associations-eager-test` (~225 sites)
- `converge-includes-preload-colon-sweep-associations-remainder` (~180 sites)

and the parent story then only has to delete the colon-stripping normalization
in `Relation#joinedIncludesValues` (`relation.ts:2790-2798`), collapsing it back
to `relation.rb:1247-1249`'s plain `includes_values & joins_values` intersection.

## Acceptance criteria

- [ ] `Branch#_normalizeAssociationName` strips a leading colon on the string
      arm, citing `join-dependency.ts:933` as the sibling site.
- [ ] Both spellings resolve to the same reflection; no other normalization
      site is added.
- [ ] Generated SQL unchanged on all three adapters; no test name touched.
