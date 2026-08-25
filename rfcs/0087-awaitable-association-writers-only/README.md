---
rfc: "0087-awaitable-association-writers-only"
title: "Awaitable association writers only: delete the synchronous property setters"
status: draft
created: 2026-08-03
updated: 2026-08-10
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
related-rfcs:
  - "0068-awaitable-has-one-setter"
priority: 3
---

## Summary

Delete the synchronous property setters generated for **association** writers.
`owner.account = x`, `owner.items = [...]`, `owner.itemIds = [...]` and
`owner.shipAttributes = {...}` stop existing; the awaitable methods that already
port the same Rails writers — `await owner.setAccount(x)`,
`await owner.association(name).writer(...)` / `replace(...)` / `idsWriter(...)`,
`await owner.setShipAttributes({...})` — become the only association-mutation
surface.

RFC 0068 already established `set#{Name}` as the faithful rendering of Rails'
`#{name}=` and made the `=` setter throw on a persisted owner while keeping it
in-memory for an unpersisted one. That split is the problem this RFC finishes:
whether `=` works depends on whether the owner happens to be saved, which is
prior knowledge the call site does not carry. One surface, always awaited.

## Motivation

### The split is the defect

After RFC 0068 §2, `owner.account = x` has two behaviors:

- **Unpersisted owner** — in-memory `replace`, genuinely faithful (Rails does no
  I/O either: `save &&= owner.persisted?`,
  `vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:66`).
- **Persisted owner** — `HasOnePersistedAssignmentError`.

Both arms are individually defensible; the pair is not. The reader of
`pirate.ship = ship` cannot tell which one they get without knowing the owner's
persistence state, and the state can change between the line being written and
the line being run. The same shape repeats on collections
(`CollectionIdsAssignmentError`) and, in a third variant, on nested attributes,
where the sync setter neither throws nor is faithful — it defers displacement to
the owner's next `save()`, which is the deviation RFC 0068's
`eliminate-sync-build-displacement-target-swap` ratified as debt.

### Deleting it is parity-neutral

Association writers are generated dynamically on **both** sides — Rails through
`Builder::Association.define_writers` into `generated_association_methods`
(`vendor/rails/activerecord/lib/active_record/associations/builder/association.rb`),
trails through `defineWriters` / `Object.defineProperty`
(`packages/activerecord/src/associations/builder/has-one.ts:88`). Neither
extractor sees `account=` or `account` as a static member, so `parity:api`
scores nothing for the property setter and loses nothing when it goes. The
Rails-named surface that IS scored is the awaitable method: `rubyMethodToTs`
already offers `set#{Name}` as a candidate for any Ruby `name=`
(`scripts/api-compare/conventions.ts:747-760`, documented in
`docs/ruby-ts-conventions.md`).

This is what separates association writers from plain attribute writers, which
this RFC does not touch: `table_name=` and friends are static, are matched by
the bare camel accessor, and are genuinely synchronous in Rails.

### The cost, honestly

Rails code assigns associations with `=`, so every ported call site that does
must become `await`. Measured at the time of writing: 104 `#{name}Attributes=`
assignments in ported tests, plus the `syncWrite` / ids-writer arms reached from
seven source files (`attribute-assignment.ts`,
`associations/builder/has-one.ts`, `associations/builder/collection-association.ts`,
`associations/collection-association.ts`, `associations/collection-proxy.ts`,
`associations/has-many-through-association.ts`,
`associations/has-one-association.ts`). Test **names** never change — only the
assignment expression inside the body, which is exactly the deviation the file's
header already documents.

We accept it for the reason RFC 0068 accepted the throw: JS has no synchronous
DB I/O, so Rails' assignment semantics are unimplementable on a property setter.
Given that, an API with one always-correct spelling beats one whose correctness
depends on unstated state.

## Design

### 1. What is deleted

- The generated `#{name}=` property setter for `has_one` / `belongs_to`-style
  singular associations.
- The generated `#{name}=` and `#{name}Ids=` property setters for collections.
- The generated `#{name}Attributes=` property setter from
  `generateAssociationWriter` (`packages/activerecord/src/nested-attributes.ts`),
  together with the deferred-displacement machinery it is the sole reason for:
  `prepareDetachDisplacedForSyncBuild`, `findThenDetachDisplaced`,
  `_pendingDisplacedRemovals`, `_displacedRemovalFailure` and their drain.
  `HasOneAssociation#syncWrite`, `CollectionAssociation#syncWrite` /
  `syncIdsWrite`, `HasOnePersistedAssignmentError` and
  `CollectionIdsAssignmentError` were listed here and are **not** deleted — see
  §2. (Resolved by `reconcile-residual-sync-writers-with-the-gate-list`.)

### 2. What stays

- `belongs_to`'s setter, which is in-memory in Rails and in trails — no
  deviation to remove (RFC 0068 Design §5).
- The has_one / collection arms of `attribute-assignment.ts` and the four
  symbols they reach — `syncWrite`, `syncIdsWrite`,
  `HasOnePersistedAssignmentError`, `CollectionIdsAssignmentError`. Rails'
  `assign_attributes` returns nil and assigns inline
  (`activemodel/lib/active_model/attribute_assignment.rb:32-35`), and
  `awaitable-mass-assignment-for-nested-attributes` converges trails onto
  exactly that (`assignAttributes` returns `void`). A permanently synchronous
  mass assignment gives these a permanent caller, so they are the campaign's
  deliberate residue, justified at the call site — the same "loud beats
  deferred" tradeoff RFC 0068 settled. The through-inverse wiring in
  `collection-proxy.ts` / `has-many-through-association.ts` rides the same
  route.
- Every plain attribute setter. This RFC is scoped to association writers.
- The association **readers**, unchanged.
- `set#{Name}`, `set#{Name}Attributes`, `association(name).writer` /
  `replace` / `concat` / `idsWriter` — the surface everything migrates to.

### 3. Mass assignment

`assignAttributes` / `update` / `create` reaching an association key currently
routes to the sync writer. With the writers gone, the faithful shape is the
awaitable one: `update` and `create` are already async, so they can await the
association write inline where Rails' `assign_attributes` does it. A
`new Foo({ account: x })` constructor arm cannot await and must raise, naming
`await foo.setAccount(x)` — the one place a throw survives, because there is no
awaitable constructor to redirect to.

## Non-goals

- **Plain attribute setters.** Static, synchronous in Rails, matched by
  `parity:api` on the bare camel name.
- **`belongs_to`.** No deviation.
- **Changing `parity:api` conventions.** `set#{Name}` is already an accepted
  rendering of `name=`; no rule change is needed for this RFC.
- **Reviving the sync setter behind a config flag.** Two spellings with
  different semantics is the defect, not the fix.

## Rollout

Sequenced so the awaitable surface and the call-site migration land before the
setters are deleted, and so no single PR exceeds the LOC ceiling:

1. Migrate ported call sites off `=` for each association family, one family per
   PR (the setters still work, so each migration is independently mergeable).
2. Delete the setter for that family and its error class.
3. Delete the nested-attributes deferred-displacement machinery, which is
   unreachable once its only caller is gone.
4. Delete the mass-assignment routing arms and add the constructor throw.

## Verification

- `pnpm parity:api` / `pnpm parity:test` deltas non-negative (expected: no
  movement — the deleted members are not in either population).
- `pnpm parity:api:extra --package activerecord` drops the invented error classes.
- `pnpm parity:api:calls` / `pnpm parity:api:calls` clean; baseline rows whose methods
  are deleted must be removed by hand, not reseeded.
- A grep gate to zero on `_pendingDisplacedRemovals`, `_displacedRemovalFailure`,
  `prepareDetachDisplacedForSyncBuild` and `findThenDetachDisplaced`. NOT on
  `syncWrite` / `syncIdsWrite` / the two error classes: §2 keeps those.

## Open questions

None. The constructor arm was the candidate question and is resolved: **`new
Foo({ account: x })` keeps assigning in memory, synchronously, and needs no
awaitable form.**

A constructor's owner is unpersisted by definition, and every path Rails can
reach from there is in-memory:

- `save &&= owner.persisted?` (`has_one_association.rb:66`) is false, so
  `replace` opens no transaction and saves no record.
- `remove_target!`'s nullify save is gated on `target.persisted? &&
owner.persisted?` (`:108`).
- `find_target?` is `!loaded? && (!owner.new_record? || foreign_key_present?) &&
klass` (`association.rb:320-322`); for has_one / has_many on a new owner both
  disjuncts are false (`foreign_key_present?` defaults to false and is
  overridden only by `BelongsToAssociation`, where the FK lives on the owner),
  so `load_target` issues no query.

Rails' `new` is synchronous _because_ everything it can reach is in-memory, so
an async `Model.new` would be a deviation rather than a convergence — and it
would force `await` onto every construction in the codebase to buy nothing.
`Model.new` / `Model.build` already exist as statics (`base.ts`), and
`parity:api` maps Ruby `new` / `initialize` to `constructor`
(`scripts/api-compare/conventions.ts:699`), so no naming work is outstanding
either.

This arm is also not an instance of the split this RFC removes: `new Foo({...})`
has one behavior always, with no dependence on the owner's persistence state,
because the owner cannot be persisted.

## Changelog

- 2026-08-03: initial RFC. Extends RFC 0068, which introduced `set#{Name}` and
  the persisted-owner throw; this RFC removes the remaining synchronous arm.
