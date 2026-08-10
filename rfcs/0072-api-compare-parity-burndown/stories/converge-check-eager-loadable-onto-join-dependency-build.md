---
title: "Delete JoinDependency#validateEagerLoadSpec — route _checkEagerLoadable through constructing a JoinDependency, as Rails does"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: ["drop-join-dependency-preload-fallback-lane"]
deps-rfc: []
est-loc: 150
priority: null
pr: 5973
claim: "2026-08-03T14:24:16Z"
assignee: "converge-check-eager-loadable-onto-join-dependency-build"
blocked-by: null
closed-reason: null
---

## Context

`JoinDependency#validateEagerLoadSpec`
(`packages/activerecord/src/associations/join-dependency.ts`) is a trails
invention with no Rails counterpart. `pnpm parity:api:extra` counts it among the six
novel names in that file (`aliasedRow`, `columnsForNode`,
`instantiateFromRows`, `nodes`, `selectArel`, `validateEagerLoadSpec`), and no
story owns it — it appears in the tasks repo only as context in
`converge-join-dependency-single-build-path`. RFC 0027
(`join-dependency-fidelity`) is closed, so it has no home there.

Rails never validates an eager-load spec separately. `apply_join_dependency`
always constructs the join dependency, and `build`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb:228-238`)
raises `ConfigurationError` via `find_reflection` for a misspelled name and
`EagerLoadPolymorphicError` for a polymorphic one as a side effect of building.

trails needs the separate method only because the calculation and exists paths
never build a real tree: `Relation#_checkEagerLoadable`
(`packages/activerecord/src/relation.ts`) constructs an association-less
`JoinDependency` purely to call `validateEagerLoadSpec` per spec. The method
body is a private recursive walk duplicating `build`'s checks in the same order
(`checkValidityBang`, `checkEagerLoadableBang`, polymorphic raise).

After #5943 the constructor raises exactly those errors while building, so the
duplication is now removable: `_checkEagerLoadable` can construct a throwaway
`JoinDependency` with the real specs and discard it.

### The one behavioral difference to resolve

`validateEagerLoadSpec` deliberately does not raise for a valid-but-unjoinable
spec (composite-key, unaliasable through) — those degrade to preloading. A
strict constructor build raises `ArgumentError` for them. So this story either
depends on `drop-join-dependency-preload-fallback-lane` (after which nothing
degrades and the difference vanishes), or must pass the lenient
`fallbackAssociations` array and discard it, which converges the method away
without changing behavior.

## Acceptance criteria

- `validateEagerLoadSpec` is deleted; `Relation#_checkEagerLoadable` routes
  through constructing a `JoinDependency` instead.
- `pnpm parity:api:extra` reports 5 novel names in `associations/join-dependency.ts`,
  down from 6.
- Misspelled-name and polymorphic eager loads raise the same errors with the
  same messages on the calculation and exists paths. `join-model.test.ts`
  (`ConfigurationError` from `find_reflection`) and the
  `EagerLoadPolymorphicError` covers stay green.
- No valid-but-unjoinable spec changes behavior unless
  `drop-join-dependency-preload-fallback-lane` has landed first; state which
  route was taken in the PR body.
