---
title: "has-one-replace-missing-load-target-early-return"
status: draft
updated: 2026-07-17
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Raised in review of PR #4900.

Rails' `HasOneAssociation#replace`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb:59-65`):

```ruby
def replace(record, save = true)
  raise_on_type_mismatch!(record) if record

  return target unless load_target || record

  assigning_another_record = target != record
  if assigning_another_record || record.has_changes_to_save?
```

Line 61 is why line 65 can write `record.has_changes_to_save?` **unguarded**: if
`load_target` is nil and `record` is nil, it has already returned. Reaching line
65 with `record == nil` requires `load_target` to be truthy, which makes
`assigning_another_record` true, so the `||` short-circuits before the receiver
is touched.

Our `replace` (`packages/activerecord/src/associations/has-one-association.ts:330`)
has no equivalent early return:

```ts
protected override replace(record: Base | null, _save = true): void {
  if (record) (this as any).raiseOnTypeMismatchBang(record);
  const assigningAnother = !sameRecord(this.target, record);
  if (assigningAnother || record?.hasChangesToSave === true) {
```

PR #4900 made the receiver read safe (`record?.hasChangesToSave === true`), which is
correct and should stay — but the `?.` is standing in for a clause we never
ported, so the guard is load-bearing where Rails' is not. Two consequences:

1. **Missing `load_target` side effect.** Rails' `replace` always evaluates
   `load_target`, materializing the current target so it can be removed.
   `writeImmediate` (`has-one-association.ts:117`) does
   `if (!this.loaded) await this.loadTarget()` before delegating, so the
   immediate path is covered — but `queueWrite` (`:66`) calls `replace` directly
   with no load, and compensates with its own `_removeDisplacedFromDb` flag
   (`:86-94`). That flag exists precisely because the early return / load was
   never ported. `HasOneThroughAssociation#replace` (`:132`) likewise reaches
   `replace` with no load and carries `mightNeedDelete` for the same reason.
2. **Missing `return target` short-circuit.** With both target and record nil,
   Rails returns immediately; ours falls through to `this.target = record` /
   `loadedBang()`, marking a never-loaded association loaded.

The `?.` is not a bug and PR #4900 should not be reverted; this story is about
porting the early return so the guard stops carrying an unrelated clause.
`replace` being sync in TS (the JS property setter cannot `await`) is the reason
`load_target` was dropped, so this likely converges alongside the
`queueWrite` / `_removeDisplacedFromDb` / `mightNeedDelete` deferral machinery
rather than in isolation.

## Acceptance criteria

- [ ] Port `return target unless load_target || record`
      (`has_one_association.rb:61`), or document in `replace` why the sync
      property-setter constraint makes it impossible and what upholds the
      invariant instead.
- [ ] Assess whether `_removeDisplacedFromDb` (`has-one-association.ts:41`) and
      `mightNeedDelete` (`has-one-through-association.ts:147`) collapse into the
      ported `load_target`; converge them if so.
- [ ] `replace(null)` on a never-loaded association no longer marks it loaded, or
      the deviation is justified from the vendored source.
- [ ] No regression in the has_one / has_one_through / autosave suites.

## Notes

Superseded-in-flight by the awaitable-has_one-setter RFC
(`rfcs/0000-awaitable-has-one-setter`, number assigned at merge): its
`retire-has-one-displacement-machinery` story removes `queueWrite` /
`_removeDisplacedFromDb` / `mightNeedDelete` and ports the `replace` early
return as one of its acceptance criteria — exactly the convergence this
story's context predicted. Do not claim this story independently; it is
closed as superseded when that story lands.
