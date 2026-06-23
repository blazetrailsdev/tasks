---
title: "Fully defer within-dependency and through-path join aliasing to emit-time (rebuild ON at emit)"
status: done
updated: 2026-06-23
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 4007
claim: "2026-06-23T14:50:22Z"
assignee: "fully-defer-construction-aliasing-via-emit-on-rebuild"
blocked-by: null
---

## Context

PR #3912 (defer-join-alias-assignment-to-emit-time) was the BOUNDED step of the
convergence: it deferred only FIRST-USE single-step belongs_to/has_many join
aliasing to emit-time `makeConstraints`. Within-dependency collisions (self-join
chains, the same table reached via two include paths) and the through-association
path (`_addThroughViaJoinAssociation`, with Rails' `{candidate}_join` self-join
naming) are STILL aliased at construction and flagged `aliasFixed`, because the
name-based emit-time rebind (`_rebindChildAlias` → `rebindTableReferences`) cannot
disentangle a self-join ON that references the same real table on both sides
(target and foreign side share the real name).

Rails assigns ALL join aliases lazily at emit time in `make_constraints` by
BUILDING the ON predicate against the already-chosen alias (join_dependency.rb:189-211,
`JoinAssociation#join_constraints` resolving the table via the `aliased_table_for`
block) — never rebuilding a real-table predicate and rewriting it. To finish the
convergence, trails should rebuild the simple-path (and through-path) ON predicates
at emit against the alias resolved from the shared tracker, removing the
construction-time aliasing and the `aliasFixed` carve-out entirely.

This subsumes / depends on `self-join-alias-rebind-target-only` (the rebind
mechanism for true self-associations).

## Acceptance criteria

- [ ] `_addAssociation` no longer aliases ANY join at construction (no
      `aliasNameFor`/`aliasFixed` for the simple path); the ON predicate's target
      is bound at emit-time in `makeConstraints` to the alias resolved against the
      shared AliasTracker, so self-join chains and dup-include collisions are
      correct without a name-based rebind.
- [ ] The through-association path defers its `{candidate}_join` aliasing to
      emit-time the same way (or documents why it must stay).
- [ ] `aliasFixed` and the construction-time scope/STI rebind are removed.
- [ ] All join/merge/eager/through/self-join tests stay green; the two
      `relation_test` merge-aliasing tests stay green; `test:compare` and
      `api:compare` non-negative.
