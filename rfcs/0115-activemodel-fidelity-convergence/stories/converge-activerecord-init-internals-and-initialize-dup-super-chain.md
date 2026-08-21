---
title: "Converge ActiveRecord's init_internals / initialize_dup onto the prepend super chain"
status: in-progress
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6812
claim: "2026-08-21T11:40:28Z"
assignee: "converge-activerecord-init-internals-and-initialize-dup-super-chain"
blocked-by: null
closed-reason: null
---

## Context

PR #6802 converged ActiveModel's `init_internals` / `initialize_dup` onto a real
`prepend()` super chain: `packages/activemodel/src/model.ts` now carries no body
for either, and the Validations and Dirty hooks are prepended in include order,
each opening with its `super_` (validations.rb:467-471 and :310-313,
dirty.rb:371-376 and :248-251).

ActiveRecord still does it the old way, and its shape now shadows the converged
AM chain:

- `packages/activerecord/src/base.ts:4728` assigns an own
  `Base.prototype.initializeDup` that calls the initialize callbacks, then
  `LockingOptimistic._clearLockingColumn` and `Timestamp.clearTimestampAttributes`
  explicitly. Being an own prototype property it SHADOWS `Model.prototype`'s
  prepended chain, so `Validations#initialize_dup` and `Dirty#initialize_dup`
  never run for an AR record. In Ruby those are simply further links: Core's
  `initialize_dup` (activerecord/lib/active_record/core.rb) supers up through
  Locking::Optimistic (optimistic.rb:72-75), Timestamp (timestamp.rb:50-53),
  Attributes (activemodel/lib/active_model/attributes.rb:111-114), Validations
  and Dirty.
- `init_internals` is the same story: `packages/activerecord/src/base.ts:3164`
  and `:3248` call `_Core.initInternals.call(this)` explicitly, and each concern
  keeps a module-private `initInternals` (associations.ts:1943,
  autosave-association.ts:586, timestamp.ts:439, persistence.ts:1702,
  touch-later.ts:212, transactions.ts:559, attribute-methods/dirty.ts:164,
  aggregations.ts:308) invoked by hand instead of by ancestry. Rails has one
  root (`activerecord/lib/active_record/core.rb:834`) and every other definition
  opens with `super`.
- `packages/activerecord/src/aggregations.ts:290-296` hand-rolls the same
  wrap-and-call-inherited that `prepend()` now does, capturing
  `inheritedInitializeDup` at wire time.

`prepend()` gained the two capabilities this needs in #6802: a module may be a
method's only definition (no-op root), and `super_` arrives bound to the
receiver, so a hook spells its super call `super_(other)`.

## Converged shape

`Core#init_internals` is the chain root and every concern's hook is prepended in
Rails' include order, each opening with `super_`. `base.ts` carries no
`initializeDup` body and no explicit `_Core.initInternals.call(this)` fan-out;
`aggregations.ts` drops its hand-rolled inherited-capture in favour of
`prepend()`. Order must stay Rails': the initialize callbacks observe the
source's `lock_version` / timestamps before Locking and Timestamp clear them
(optimistic.rb:72-75, timestamp.rb:50-53).

## Acceptance criteria

- [ ] `Base.prototype` carries no own `initializeDup`; the AM Validations/Dirty
      links run for an AR record, verified by a test that dups a record with
      errors and with pending changes.
- [ ] No explicit `initInternals` fan-out in `base.ts`; each concern hook opens
      with `super_`.
- [ ] `aggregations.ts`'s `inheritedInitializeDup` capture is gone.
- [ ] Rails' clear-after-callbacks ordering preserved; `aggregations.test.ts`'s
      own-property assertions (:305, :323, :343) still hold or are updated with
      a cited reason.
- [ ] Regression test fails on the pre-change baseline.
