---
rfc: "0000-awaitable-has-one-setter"
title: "Awaitable has_one setter: retire the deferred-displacement machinery"
status: draft
created: 2026-07-17
updated: 2026-07-17
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
---

# RFC — Awaitable has_one setter: retire the deferred-displacement machinery

## Summary

Rails' `HasOneAssociation#replace`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:59-84`)
does displacement and persistence **inline and synchronously at assignment**:
it `load_target`s the currently associated record, `remove_target!`s it
(FK-nullify / destroy per `:dependent`), saves the new record, and only then
runs `self.target = record`. One path.

We have two paths, because a native JS property setter (`owner.account = x`)
cannot `await`. The deferred path (`queueWrite`) does the in-memory replace at
assignment but postpones all DB work — including removal of the displaced
row — to the owner's next `save()`. That deferral window is the root cause of
a cluster of two-row races that four PRs (#4899, #4901, #4908, #4910) each
patched one flush point of, with new windows appearing each time.

This RFC ends the whack-a-mole: the already-existing, Rails-faithful awaitable
path (`association(name).writer(x)`) becomes **the** sanctioned mutation
surface (with `await owner.setAccount(x)` sugar); the native `=` setter keeps
working for an unpersisted owner (where Rails assignment is genuinely
in-memory too) but **throws** for a persisted owner instead of silently
deferring; and once no caller can reach the deferral, the entire parallel
machinery — `_displacedRecords`, `_removeDisplacedFromDb`, `removeDisplaced`,
the `autosaveHasOne` drain, and every "flush deferred displacement before X"
patch — collapses back into Rails' single `replace` path.

## Motivation

### The deviation

Trails' `HasOneAssociation` carries two writer paths
(`packages/activerecord/src/associations/has-one-association.ts`):

1. **`queueWrite` (~L70)** — reached from the native `=` setter
   (`packages/activerecord/src/associations/builder/has-one.ts` ~L113,
   `defineWriters` → `set` → `association(name).queueWrite(value)`) and from
   mass-assignment (`packages/activerecord/src/attribute-assignment.ts`
   ~L186-193). It runs the in-memory `replace` and then, for a persisted
   owner, records what must later be undone in the DB: a loaded displaced
   record is pushed onto `_displacedRecords` (~L37); an _unloaded_ slot sets
   `_removeDisplacedFromDb` (~L48) so the pre-existing row can be re-queried
   and removed later. The DB work drains at the owner's next `save()` via
   `removeDisplaced` (~L195), called from `autosaveHasOne`
   (`packages/activerecord/src/autosave-association.ts` ~L500-506).

2. **`writer` → `writeImmediate` → `persistImmediate` (~L118-187)** — reached
   via `await owner.association("account").writer(x)`. This is the
   Rails-faithful port of `replace`: it `loadTarget`s first, removes the
   displaced record inline inside the transaction, saves the new record,
   restores the prior target's owner attributes on failure, and raises
   `RecordNotSaved` — line-for-line against `has_one_association.rb:59-84`.

`HasOneThroughAssociation` mirrors the split with its own deferral:
`queueWrite` (`has-one-through-association.ts` ~L104) queues a
`_pendingReplace` that `flushPendingReplaces` / `persistReplace` drains at
save, and `detachDisplacedTarget` is overridden to a no-op (~L93) because a
through routes displacement through the join model.

### Why the deferral is the root cause

Because the displaced row's removal is deferred, there is a window between
assignment and the owner's `save()` in which a **second FK-matching row** can
come into existence (via `create#{Name}`, via the awaitable writer, via
another assignment). The save-time re-query that `removeDisplaced` issues then
matches two rows, and Rails' singular load is an _unordered_ `LIMIT 1`
(`Association#find_target` → `scope.to_a` → `Array#first`), so **which row
survives is decided by DB row order**. Each closed PR patched one window:

- **#4899** — `set_new_record` / build-path displaced removal (four residual
  divergences after #4902/#4904/#4905 landed in pieces).
- **#4901** — `create#{Name}` after an unloaded deferred assignment: the
  insert races the pending `_removeDisplacedFromDb` re-query; fix was to
  flush inside `_createRecord` before the insert.
- **#4908** — deferred assignment followed by the awaitable `writer`:
  `writeImmediate` skips its leading `load_target` (the setter already
  flipped `loaded`), the stale row's removal falls to save time, two rows
  match; fix was to flush inside `persistImmediate`.
- **#4910** — bare `create#{Name}` over an unloaded existing row: post-create
  re-query surfaces one of two rows, order-undefined.

Four patches, four flush points, and each fix is itself more trails-only
machinery bolted onto a path Rails does not have. All four are **closed
unmerged** (their stories closed as superseded) — this RFC replaces them by
removing the window instead of patching its edges.

RFC 0063 (async validation chain) widened the exposure: `save()` now
genuinely awaits, so the deferred drains interleave with more async work.
PR #4919's belongs_to mid-flight-reader race is fallout of the same class
(an async load resolving after a synchronous reassignment).

### Why "loud" beats "deferred"

The deferral bought one thing: `owner.account = x` "just works" on a
persisted owner, silently, without an `await`. But the semantics it delivers
are not Rails' — Rails has already nullified/destroyed the displaced row and
saved `x` by the time the assignment expression returns. Ours has done
neither, and whether the right row survives a subsequent write depends on DB
row order. An API that is ergonomic but **arbitrarily loses one of two rows**
is worse than one that makes the caller type `await`: loud-and-correct beats
silently-races. The error is also mechanically actionable — the message names
the exact replacement (`await owner.setAccount(x)`), so migration is a
find-and-replace, not a redesign.

## Design

### 1. The awaitable surface: `await owner.set#{Name}(x)`

`association(name).writer(x)` already exists and is Rails-faithful for both
`has_one` and `has_one_through`. Add ergonomic sugar: a generated
`set#{Name}` async method on the model (alongside the existing `build#{Name}`
/ `create#{Name}` accessors defined in `builder/has-one.ts` ~L76-93) that is
a thin wrapper:

```ts
await owner.setAccount(x); // ≡ await owner.association("account").writer(x)
await owner.setAccount(null);
```

No new semantics — the wrapper adds nothing beyond delegation, so fidelity
review stays anchored on `writer` ↔ `replace`. For **collections**, no new
verbs are invented: the Rails-named awaitable methods that already exist
(`replace`, `concat` / `push` — Rails' `<<` — `destroy`, `destroyAll`,
`delete`) are the sanctioned surface.

### 2. The native `=` setter: in-memory for new owners, throws for persisted

- **Unpersisted owner:** `owner.account = x` stays. In Rails, `replace` on a
  new-record owner does no I/O either — `save &&= owner.persisted?` (:66)
  falls to false, `transaction_if(false)` just yields, and `remove_target!`'s
  save is gated on `owner.persisted?` (:108). Assignment is genuinely
  in-memory; persistence happens at the owner's first `save()` via autosave.
  Our setter matches Rails exactly here, so it keeps working.
- **Persisted owner:** the setter **throws** a clear, actionable error:

  ```text
  Cannot assign has_one association `account` with `=` on a persisted
  record: Rails persists the replacement at assignment time, which requires
  `await` in JS. Use `await owner.setAccount(x)` (or
  `await owner.association("account").writer(x)`).
  ```

  Mass-assignment (`attribute-assignment.ts` ~L186-193, the `hasOne` arm
  routing to `queueWrite`) gets the same treatment: `assignAttributes` /
  `update` reaching a has_one key on a persisted owner throws the same
  error. (Nested-attributes flows route through their own machinery, not
  this arm, and are unaffected.)

**The ergonomic tradeoff, honestly:** this makes trails _stricter_ than
Rails — code that is legal Rails (`firm.account = account` on a persisted
firm) becomes a throw in trails, and the port of a Rails app must rewrite
each such site with `await`. That is a real cost. We accept it because the
alternatives are: (a) silent deferral with an order-undefined two-row race
(the status quo this RFC exists to kill), (b) a floating promise from the
setter (unawaitable by any caller syntax; failure surfaces as an unhandled
rejection long after the assignment), or (c) keeping the flush-point
whack-a-mole forever. JS has no synchronous DB I/O, so Rails' assignment
semantics are _unimplementable_ on the native setter for a persisted owner;
the honest port is to say so at the exact call site. This is the same
"behavioral fidelity beats signature fidelity" call
RFC 0063-async-validation-chain ratified for `isValid`.

### 3. Retiring the machinery

Once no caller can reach the deferral, remove — sequenced so the machinery
goes only after the new surface and erroring setter are in:

- `HasOneAssociation`: `queueWrite`, `_displacedRecords`,
  `_removeDisplacedFromDb`, `removeDisplaced`, `removeOne`, the
  `_displacedRecords` push in `setNewRecord`, and the `reset()` clearing of
  both fields (`has-one-association.ts` ~L37-58, ~L70-107, ~L195-242,
  ~L551-566).
- The `autosaveHasOne` drain (`autosave-association.ts` ~L500-506).
- Every "flush deferred displacement before X" patch that landed with the
  cluster: the `_createRecord` flush (#4901's fix), the `persistImmediate`
  flush (#4908's fix), and any sibling flush points added since — grep-gate
  `removeDisplaced|_removeDisplacedFromDb|_displacedRecords|queueWrite` to
  zero.
- `HasOneThroughAssociation`: the `queueWrite` override (~L104), and the
  persisted-owner half of the `_pendingReplace` deferral — a persisted
  owner's replace goes through `writer` → `persistReplace` immediately, as
  Rails' `create_through_record` does at assignment. The **new-owner** half
  stays: Rails itself defers there (`owner.new_record? || !save` →
  `through_proxy.build`, `has_one_through_association.rb:33-35`), so a
  save-time flush for a new owner is the faithful shape.
- `builder/has-one.ts` `defineWriters` swaps `queueWrite` for the
  throw-or-in-memory dispatch. The create/build accessors' displaced-target
  handling (`detachDisplacedTarget` ~L457, `needsTargetLoadForBuild`,
  `loadTargetForBuild`) is _kept_ — it is the port of `replace`'s inline
  `remove_target!` on the build/create path and is exactly the Rails shape.
- The retirement also absorbs the pre-existing draft story
  `has-one-replace-missing-load-target-early-return`
  (`rfcs/0005-activerecord-gaps/stories/`): Rails' `return target unless
load_target || record` (`has_one_association.rb:61`) was never ported
  precisely because the sync `queueWrite` path could not `await` the load —
  `_removeDisplacedFromDb` (and the through's `mightNeedDelete`) exist as its
  stand-ins, as that story itself observes. Once the sync persisted-owner
  path is gone, the surviving `replace` callers can carry the faithful early
  return: `writeImmediate` already does the leading `loadTarget`, and the
  new-owner in-memory path has nothing to load. Porting the early return
  (including not marking a never-loaded association loaded on
  `replace(null)`) is folded into `retire-has-one-displacement-machinery`,
  and the 0005 story is closed as superseded when that story lands.

End state: one persistence path (`writer` ≙ `replace`), one autosave path
(`autosaveHasOne` ≙ `save_has_one_association`, no drain), matching Rails
file-for-file.

### 4. Interaction with RFC 0063 and the kept fixes

- **RFC 0063** made `save()` genuinely await the validation chain, widening
  every deferred-drain window. This RFC removes the windows rather than
  re-narrowing them; the two RFCs compose.
- **#4919** (belongs*to reader load guarded against mid-flight FK
  reassignment) is an \_independent* race in the async reader, not the
  has_one deferral — it exists even with this RFC landed. **Keep.**
- **#4832** (restore prior target on failed replacement/creation in
  `persistImmediate`) hardens the awaitable path this RFC promotes.
  **Keep.**
- **#4836** (negative-cache reset) — independent correctness fix. **Keep.**

### 5. belongs_to and has_many

- **belongs_to: native setter stays, unchanged.** Rails'
  `BelongsToAssociation#replace` (`belongs_to_association.rb:95-107`) is
  purely in-memory: it sets the inverse and `replace_keys` writes the FK
  **on the owner**; the DB write happens at the owner's `save()`. That is
  exactly what a synchronous JS setter can express — no I/O, no deferral
  invention, no race window of this class. (The #4919 reader race is a
  separate async-reader issue, fixed there.)
- **has_many / habtm: same erroring-setter treatment, as a follow-on
  story.** Rails' `CollectionAssociation#writer` → `replace`
  (`collection_association.rb:46-48`, `:242`) does immediate DB work
  (`replace_records` in a transaction) for a persisted owner — the same
  unawaitable-at-assignment shape as has_one. Trails' collection assignment
  defers via its own `_pendingReplace`
  (`packages/activerecord/src/associations/collection-association.ts` ~L37,
  ~L503-517), which is the same deviation with the same latent window class
  (deferred deletes racing interim inserts). The call: persisted-owner
  collection `=` assignment (and `#{singular}Ids=`) also throws, pointing to
  `await owner.items.replace(...)` / the awaitable `idsWriter`; new-owner
  assignment stays in-memory. Sequenced as a late story so the
  singular-association core lands and settles first.

## Non-goals

- **Making the native setter async-transparent** (Proxy/thenable tricks that
  make `owner.account = x` awaitable): a setter's value expression cannot be
  awaited by any caller syntax; anything in this direction is a floating
  promise wearing a costume.
- **Folding #4919 / #4832 / #4836 into this RFC:** each is an independent,
  already-reviewed fix on paths this RFC keeps. They merge on their own.
- **Nested attributes / autosave redesign:** `accepts_nested_attributes_for`
  and `autosaveHasOne`'s save-the-child half mirror Rails' own save-time
  machinery and are unaffected; only the trails-invented displacement drain
  is removed.
- **belongs_to setter changes:** in-memory in Rails, in-memory here — no
  deviation to fix (see Design §5).
- **Deterministic ordering for the two-row `LIMIT 1`:** #4910 explored
  making the survivor deterministic; ratified direction is fidelity — this
  RFC removes the two-row state instead of ordering it.

## Alternatives considered

- **Keep deferral, keep patching flush points:** the four-PR history
  (#4899/#4901/#4908/#4910) is the empirical case against — each fix added
  trails-only machinery and a new window appeared behind it.
- **Floating-promise setter** (`set` calls `writer` and drops the promise):
  preserves `=` syntax and even ordering in the common case, but failures
  (`RecordNotSaved`, a failed nullify-save) become unhandled rejections
  detached from the assignment site, and callers cannot sequence subsequent
  reads. Violates the no-floating-promises lint RFC 0063 just tightened.
- **Deprecation warning instead of a throw on persisted owners:** keeps the
  race live for every un-migrated call site; a warning on an
  order-undefined data-loss path is not an acceptable steady state. The
  throw's message makes migration mechanical.
- **Defer but flush eagerly on every subsequent association entry point:**
  amounts to enumerating flush points forever — #4901/#4908 were exactly
  this, one point at a time.

## Rollout

Ordered stories (deps enforce the sequence; machinery removal only after the
new surface + erroring setter are in):

1. `awaitable-set-accessor-sugar` — generate `set#{Name}` on has_one (incl.
   through) delegating to `association(name).writer`.
2. `has-one-setter-throws-on-persisted-owner` — native `=` setter and the
   mass-assignment hasOne arm: in-memory replace for new owners, throw for
   persisted owners. Migrate in-repo callers. (deps: 1)
3. `retire-has-one-displacement-machinery` — remove `queueWrite`,
   `_displacedRecords`, `_removeDisplacedFromDb`, `removeDisplaced`, the
   `autosaveHasOne` drain, and the #4901/#4908 flush points; port the
   `replace` early return, absorbing 0005's
   `has-one-replace-missing-load-target-early-return` (closed as superseded
   when this lands); grep-gate zero. (deps: 2)
4. `has-one-through-pending-replace-persisted-immediate` — through
   `queueWrite` override removed; persisted-owner replace goes immediate via
   `persistReplace`; new-owner deferral kept (Rails-faithful). (deps: 3)
5. `collection-writer-throws-on-persisted-owner` — extend the
   erroring-setter call to has_many/habtm `=` and `#{singular}Ids=`; retire
   the persisted-owner half of collection `_pendingReplace`. (deps: 3)
6. `awaitable-setter-docs-and-deviation-cleanup` — update comments/prose
   that describe the deferral, verify test:compare non-negative, final grep
   gates. (deps: 4, 5)

## Verification

- `git grep -nE "queueWrite|_displacedRecords|_removeDisplacedFromDb|removeDisplaced" packages/activerecord/src`
  → 0 hits (excluding docs/error-message mentions).
- `has_one` / `has_one_through` / autosave / nested-attributes suites green
  on all three adapters; `test:compare` delta non-negative for
  `has_one_associations_test` and `has_one_through_associations_test`.
- The #4899/#4901/#4908/#4910 regression scenarios (two-row races) are
  re-expressed as: persisted-owner `=` throws (deterministically), and the
  awaitable path removes the displaced row inline — no order-dependent
  assertions remain.

## Open questions

None. The candidate questions were resolved in this draft: the ergonomic
tradeoff of throwing on legal-in-Rails syntax (Design §2 — accepted,
loud-and-correct over order-undefined data loss), the belongs_to /
collection scope calls (Design §5), and the fate of the overlapping 0005
early-return story (Design §3 — absorbed into
`retire-has-one-displacement-machinery`).

## Changelog

- 2026-07-17: initial RFC. Supersedes PRs #4899 / #4901 / #4908 / #4910
  (closed unmerged; their stories closed as superseded) and absorbs
  0005's `has-one-replace-missing-load-target-early-return`.
