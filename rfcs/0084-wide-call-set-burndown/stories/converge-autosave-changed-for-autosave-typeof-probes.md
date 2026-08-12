---
title: "converge the changed_for_autosave? typeof probes in the autosave save bodies"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6409
claim: "2026-08-12T12:26:11Z"
assignee: "call-args-ar-extra-argument-rest-2"
blocked-by: null
closed-reason: null
---

## Context

Found next to #6403 (`converge-changed-for-autosave-marked-for-destruction`).

Rails calls `changed_for_autosave?` unconditionally in both save bodies:

- `activerecord/lib/active_record/autosave_association.rb:487`
  — `return unless (autosave && record.changed_for_autosave?) || _record_changed?(reflection, record, primary_key_value)`
- `activerecord/lib/active_record/autosave_association.rb:549`
  — `saved = if record.new_record? || (autosave && record.changed_for_autosave?)`

trails `packages/activerecord/src/autosave-association.ts` wraps both in a
`typeof` probe with a `record.changed` fallback that has no Rails counterpart —
`saveHasOneAssociation` (~line 380):

    const changedForSave =
      typeof (record as any).changedForAutosave === "function"
        ? (record as any).changedForAutosave()
        : !!(record as any).changed;

and the same shape in `saveBelongsToAssociation` (~line 495). Two more
`record.changedForAutosave?.() ?? false` optional-call sites appear in
`associatedRecordsToValidateOrSave` / `isNestedRecordsChangedForAutosave`
(~lines 590, 612, 635, 665).

Every record reaching these bodies is a `Base`, and `changedForAutosave` is
mixed onto `Base.prototype` via `include(Base, AutosaveAssociation)`
(`base.ts:4959`), so the probes are dead branches — and the `record.changed`
fallback is a second, divergent definition of dirtiness (`changed` and
`hasChangesToSave` are both `_dirty.changed`, `activemodel/src/model.ts:1968`).

## Converged shape

A plain `record.changedForAutosave()` at each site, with the local named
per Rails (`changed_for_autosave?` inlined into the condition at :487 and :549
rather than hoisted into a `changedForSave` local Rails does not have).

## Acceptance criteria

1. Both save bodies call `record.changedForAutosave()` directly, inline in the
   Rails condition, with no `typeof` probe and no `record.changed` fallback.
2. The `?.() ?? false` optional-call sites likewise call the method plainly.
3. The `changedForSave` local — which Rails does not extract — is inlined.
4. Any freed `call-mismatches-exclude/` row is deleted by hand (only-shrink);
   no rows added; `parity:api:extra --package activerecord` gains no row.
5. Existing autosave/nested-attributes suites stay green.
