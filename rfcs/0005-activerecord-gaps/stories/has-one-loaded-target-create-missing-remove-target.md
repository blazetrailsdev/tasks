---
title: "has-one-loaded-target-create-missing-remove-target"
status: in-progress
updated: 2026-07-16
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4904
claim: "2026-07-16T13:11:13Z"
assignee: "has-one-loaded-target-create-missing-remove-target"
blocked-by: null
closed-reason: null
---

## Context

> UPDATE (2026-07-16): **largely converged by #4902** ("displaced-record slot
> becomes an ordered collection"), which rewrote `setNewRecord` to run
> `remove_target!`'s in-memory half and push the displaced record onto
> `_displacedRecords`. Re-probed on main after that merge: the loaded-target
> create path now detaches the old row **at the owner's next `save()`** (nullify
> arm — `firm_id` nulled, attached count 1), so the original "leaves the old row
> attached" premise below is stale. The only RESIDUAL is timing: Rails detaches
> synchronously inside `create_#{name}`, we detach at owner-save, because sync
> `replace`/`setNewRecord` cannot `await`. That is the same deferred-timing
> deviation the whole has_one queueWrite design carries, not a lost row. Rescope
> this story to the create-time-vs-save-time window (or close it as covered by
> #4902 if that residual is deemed acceptable); the original full-detachment AC
> is met. The KNOWN GAP doc note this story referenced was dropped when #4901
> rebased onto #4902.

Raised in review of PR #4901 (`has-one-unloaded-displacement-create-window`) and
confirmed by probe. Distinct root cause from #4901, which covered only the
_deferred-assignment_ displacement paths.

Rails runs `remove_target!` inside `HasOneAssociation#replace`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:69`)
whenever `assigning_another_record` is true:

```ruby
transaction_if(save) do
  remove_target!(options[:dependent]) if target && !target.destroyed? && assigning_another_record
```

Only the `transaction_if` _wrapper_ is gated on `save` — `remove_target!` itself
is not. So `set_new_record`'s `replace(record, false)` (rb:91-93) still detaches
the old target. Our `replace`
(`packages/activerecord/src/associations/has-one-association.ts:332-349`) and
`setNewRecord` (:450-452) never call `removeTargetBang`, because `replace` is a
sync method and cannot `await` the removal.

Consequence: creating over an **already-loaded** target leaves the previous row
attached. No property setter is involved, so no displacement flag
(`_displacedRecord` / `_removeDisplacedFromDb`) is set and PR #4901's
`_createRecord` flush never fires.

Probed on `Company`/`Account` (`Company.has_one("account", { foreignKey: "firm_id" })`,
no `:dependent`, so the nullify arm applies):

```ts
const c = await Company.find(company.id);
await c.loadHasOne("account"); // materialize the target — no setter, no flags
await c.createAccount({ credit_limit: 70 });
// old account's firm_id is STILL set; Account.where({ firm_id: company.id }).count() === 2
```

Expected per Rails: the old account's `firm_id` is nulled by `remove_target!`
during `create_account`, leaving exactly one attached account.

Note the doc comment at has-one-association.ts:438-448 (as amended by #4901)
flags this gap inline; it should be trimmed back to a plain `set_new_record`
mirror once this is fixed.

The fix likely belongs on the async `_createRecord` path (capture the loaded
target before `super._createRecord` and run `removeTargetBang` per `:dependent`),
since sync `replace` cannot await — mirroring how #4901 handled the deferred
arms. Check whether the sync `build#{name}` path needs the same treatment: it
inserts no row, so it may be unaffected, but `set_new_record` is shared.

## Acceptance criteria

- [ ] `owner.createChild()` over an already-**loaded** has_one target detaches the
      prior row (FK nulled / destroyed per `:dependent`), matching
      `remove_target!` at has_one_association.rb:69.
- [ ] Test reproduces the loaded-target create path (load the target explicitly,
      no property-setter assignment) and asserts the old row is detached when
      `create#{name}` returns — not merely after the owner's save.
- [ ] Confirm the `build#{name}` / `setNewRecord` path is either correct or
      covered by the same fix.
- [ ] Trim the KNOWN GAP note at has-one-association.ts:438-448 once converged.
- [ ] No regression in the has_one / has_one_through / autosave suites.
