---
title: "Inverse-of wiring on single-association access path (recursive/STI/callbacks/autosave)"
status: claimed
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: 200
priority: 17
pr: null
claim: "2026-06-16T20:48:46Z"
assignee: "inverse-of-single-association-access-convergence"
blocked-by: null
---

## Context

Surfaced during RFC 0030 story a6-inverse-and-association-tail. Several
`inverse_associations_test.rb` cases remain `it.skip` because the inverse-of
target is not wired on the **single-association access path** (Rails wires it
inside the load block, before callbacks). Affected TS tests in
`packages/activerecord/src/associations/inverse-associations.test.ts`:

- `recursive inverse on recursive model has many inversing` — the
  `InverseOfAssociationRecursiveError` class + `checkValidityOfInverseBang`
  recursion check both exist (`reflection.ts:330`), but `checkValidity!` is only
  invoked for through-reflections + join dependency, never on the direct
  belongs_to/has_many access path, so `topic.branch.branch` never raises.
- `parent instance should be shared with every child on find for sti` — non-STI
  parent-sharing on find works, but the STI scoped collection (`special_posts`,
  class_name `SpecialPost`) returns 0 rows via `loadHasMany` (STI
  association-scope gap).
- `inverse instance should be set before find callbacks are run` /
  `inverse instance should be set before initialize callbacks are run` — the
  has_many inverse is wired AFTER the child's find/initialize callbacks fire;
  Rails sets the inverse inside the load block, before `run_callbacks(:find)`.
- `inversed instance should load after autosave if it is not already loaded` —
  the autosave path must load the not-yet-loaded inverse has_one after the owner
  save (Rails `autosave_association`).

Rails ref: `vendor/rails/activerecord/test/cases/associations/inverse_associations_test.rb`
(tests at lines 678, 688, 858, 993, 441).

## Acceptance criteria

- [ ] Wire inverse-of onto the single-association access path (load block), before find/initialize callbacks.
- [ ] STI scoped has_many collections load + share the parent inverse.
- [ ] `check_validity!` recursion check fires on direct association access (raises `InverseOfAssociationRecursiveError`).
- [ ] Autosave loads the not-yet-loaded inverse has_one after owner save.
- [ ] Un-skip the 5 listed tests in `inverse-associations.test.ts`; they pass.
