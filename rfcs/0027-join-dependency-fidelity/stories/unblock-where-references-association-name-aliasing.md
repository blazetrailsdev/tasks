---
title: "Unblock the where-references-association-name eager-load tests covering lazy make_constraints aliasing"
status: draft
updated: 2026-06-15
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: ["converge-references-lazy-make-constraints"]
deps-rfc: []
est-loc: 200
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`converge-references-lazy-make-constraints` (#3355) moved referenced-table alias
resolution into `JoinDependency#makeConstraints` (`_applyReferencedAlias`),
mirroring Rails `make_constraints` reading `@references[reflection.name]`
(join*dependency.rb:202). That logic — the `posts AS post` rename, the
collision fallback to `reflection.alias_candidate` (`{plural}*{parent}`,
alias_tracker.rb), and the nested-child ON-predicate rebind — is currently
reachable in trails ONLY via:

1. auto-derived assoc-name references from `where("children.x": …)` /
   `order(assoc: …)` (NOT manual `.references(...)`, which `_aliasableReferences`
   tags manual and excludes, mirroring Rails seeding `@references` only from
   SqlLiteral references), or
2. direct white-box `joinConstraints(references)` calls.

The two Rails tests that exercise (1) end-to-end are ported but **skipped** in
`packages/activerecord/src/associations/eager.test.ts`:

- `type cast in where references association name`
  (`test_type_cast_in_where_references_association_name`,
  `Comment.includes(:children).where("children.label": "child")` →
  `comments AS children`)
- `attribute alias in where references association name`
  (`test_attribute_alias_in_where_references_association_name`,
  `Firm.includes(:clients).where("clients.new_name": "Summit")`)

Both are blocked on an eager-loading feature gap (the skip stubs cite
`associations/eager.ts` / `preloader.ts` missing eager-loading semantics for
`where` conditions on a referenced association). Until that gap closes, the
lazy `_applyReferencedAlias` path (including the collision and grandchild-rebind
branches Copilot/review flagged on #3355) has no Rails-test coverage — its only
exercise was a bespoke white-box unit test that was removed in favor of
Rails-matching tests.

## Acceptance criteria

- [ ] Implement the eager-loading semantics needed so
      `type cast in where references association name` and
      `attribute alias in where references association name` pass unskipped in
      `eager.test.ts`, with bodies faithful to the Rails originals (verbatim
      test names; canonical models / fixtures per the fidelity convention).
- [ ] The unblocked tests exercise `JoinDependency#_applyReferencedAlias`
      end-to-end (the referenced association is aliased to its reference name,
      e.g. `comments AS children`), giving the lazy make_constraints path real
      coverage.
- [ ] If the self-referential `children` case (`comments AS children`) hits the
      collision and/or nested-child rebind branches, confirm those are covered;
      otherwise note which internal branches remain reachable only by deeper
      nesting and whether further Rails tests cover them.

## Notes

Depends on `converge-references-lazy-make-constraints` (#3355). The gap is in
eager-load `where`-on-referenced-association handling, not in JoinDependency
aliasing itself — that aliasing already converged in #3355. Scope is the
eager-loading feature work the skip stubs estimate at ~50–200 LOC; keep it to
the two named tests rather than the whole `~10–79` blocked-test cluster unless
they share the same fix.
