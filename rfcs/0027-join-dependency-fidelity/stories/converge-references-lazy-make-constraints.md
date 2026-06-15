---
title: "Converge references consumption to Rails' lazy make_constraints aliasing"
status: claimed
updated: 2026-06-15
rfc: "0027-join-dependency-fidelity"
cluster: join-dependency
deps: ["converge-join-constraints-references"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-06-15T14:34:31Z"
assignee: "converge-references-lazy-make-constraints"
blocked-by: null
---

## Context

Follow-on to `converge-join-constraints-references` (#3253), which converged the
`joinConstraints(joinsToAdd, aliasTracker, references)` _signature_ — references
arrive as an argument, and the stored `_references` field + `setReferences`
setter are gone. But that story left the _consumption_ eager: trails still
resolves the referenced-table aliasing during tree construction in
`addAssociation` (the `referencedAlias`/`keyName` block,
`join-dependency.ts:243`), so by the time `joinConstraints` runs there is
nothing left to do with `references` and the parameter is `void`-ed
(`join-dependency.ts:585`).

Rails resolves this lazily in `make_constraints`
(`join_dependency.rb:202`): `table_name = @references[reflection.name.to_sym]`
is read at constraint-emission time and fed to
`alias_tracker.aliased_table_for(reflection.klass.arel_table, table_name)`.
`join_constraints` only _records_ the references into `@references`
(`join_dependency.rb:88–92`); the aliasing decision happens per-node during
emission.

This is the deviation surfaced by RFC 0023's
`join-dependency-references-resolved-at-build-not-make-constraints` (PR #3299),
which documented the divergence as a tracked deviation pending convergence
rather than ratifying it. This story is that convergence.

## Acceptance criteria

- [ ] `joinConstraints` populates a `@references`-equivalent map from the
      `references` argument (mirroring `join_dependency.rb:88–92`); `void
references` is removed.
- [ ] `makeConstraints` resolves the referenced-table alias lazily via the
      reflection name (`@references[reflection.name]` → `aliasedTableFor`),
      mirroring `join_dependency.rb:202`.
- [ ] The eager `referencedAlias`/`keyName` aliasing block in `addAssociation`
      is removed, and `references` no longer threads through
      `addAssociationSpec`/`_buildSpecTree`/`_addOrReuse`/`addAssociation`.
- [ ] All `references()`/`order(assoc:)`/eager_load tests pass unchanged
      (referenced association still aliased to its reference name, e.g.
      `authors AS author`).
- [ ] Diff under the 300 LOC ceiling.

## Notes

Depends on the build-once tree (`converge-tree-construction-make-tree`, done)
and the alias-tracking convergence (`converge-alias-tracking`, done) already
landed. The risk is that the eager model currently aliases at a point where the
full collision picture is known up front; moving to lazy per-node resolution
must keep `aliasedTableFor`'s collision suffixing identical (covered by the
self-join collision tests from `converge-collision-alias-naming`).
