---
title: "Arel clones build a fresh instance instead of copying every ivar like Object#clone"
status: in-progress
updated: 2026-08-26
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 7102
claim: "2026-08-26T20:10:48Z"
assignee: "arel-node-predicate-inlined-at-three-call-sites"
blocked-by: null
closed-reason: null
---

## Context

Surfaced porting `nodes/{case,select_core,delete,insert,update,select}_statement_test.rb`'s
`#clone` bodies in PR #7079 (RFC 0122), which are the first tests in the tree to
assert clone semantics rather than just that a clone exists.

Ruby's `Object#clone` allocates a copy carrying **every** ivar, then runs
`initialize_copy` on it. Every arel clone in trails instead builds a **fresh**
instance and copies a hand-written list of fields:

- `packages/arel/src/select-manager.ts` `clone()` — `new SelectManager()` then
  `copy.ast = this.ast.clone()`
  (`vendor/rails/activerecord/lib/arel/tree_manager.rb:60-63`,
  `select_manager.rb:14-17`)
- `packages/arel/src/nodes/case.ts` `clone()` — `new Case()` then three slots
  (`case.rb:29-33`)
- `packages/arel/src/nodes/select-core.ts` `clone()` — `new SelectCore()` then
  seven fields (`select_core.rb:36-42`)
- `packages/arel/src/nodes/{delete,insert,update,select}-statement.ts` `clone()`
  — same shape (`delete_statement.rb`, `insert_statement.rb:16-21`,
  `update_statement.rb`, `select_statement.rb:19-24`)

Today this is unobservable: PR #7079's reviewer checked each class and none
carries a field outside its copied list. It stops being unobservable the moment
anyone adds a field or subclasses one of these node types — Ruby would carry the
new field for free, and these clones silently drop it.

`Binary#clone` (`packages/arel/src/nodes/binary.ts`, `binary.rb:14-18`) already
has the converged shape and is the model: `Object.assign(Object.create(proto),
this)` to copy every own property, then the `initialize_copy` slot work.

## Constraint that shaped the current code

A generic prototype copy is NOT safe for every node. Where a Rails `include`
override is ported as a **bound instance property** — the settled trails idiom —
the copy carries a function still bound to the ORIGINAL:

- `Case#when` (`case.ts:33`, an arrow property overriding `Predications.when`)
- `NamedFunction#over` (`named-function.ts:29`)

`Case#clone` builds through the constructor precisely to dodge this, and
`cloneSlot` in `binary.ts` documents the same hazard on its shallow arm. Any
convergence has to re-bind such properties on the copy (or give those classes
their own `clone`), not just switch to `Object.create`.

## Converged shape

Each `clone()` copies every own property the way `Binary#clone` does, then does
only the slot duplication its Ruby `initialize_copy` does — with bound instance
properties re-bound to the copy.

## Acceptance criteria

- [ ] Every arel `clone()` listed above copies all own properties before running
      its `initialize_copy` work.
- [ ] A regression test proves a field added to one of these classes survives a
      clone without editing `clone()`.
- [ ] `Case#when` and `NamedFunction#over` on a clone mutate the CLONE, not the
      original — asserted directly.
- [ ] `pnpm vitest run packages/arel/src` green; `parity:api:extra:gate` and the
      call ratchets unchanged.
