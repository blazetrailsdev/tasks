---
title: "converge-has-one-through-replace-pending-state"
status: claimed
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-15T15:50:15Z"
assignee: "await-disconnect-pool-from-pool-manager"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails#7747. `HasOneThroughAssociation#replace`
(`packages/activerecord/src/associations/has-one-through-association.ts`) is not Rails'
two-operation body (`vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb:10-13`:
`create_through_record(record, save); self.target = record`). Instead it keeps trails-only
deferred state — `_pendingReplace`, `_pendingUnloadedThroughReconcile` — plus the
`constructThroughRecordInMemory` / `persistReplace` decomposition, sets `target` before the through
write, and is drained from `autosave-association.ts` (`flushPendingReplaces`, `saveHasOneAssociation`).
Because that state exists, `HasOneThroughAssociation#reset` must clear it and carries a
`@noRailsEquivalent CONVERGEABLE` receipt pointing here (Rails inherits `Association#reset`, `association.rb:61`).

The blocker measured in #7747: `create_through_record` calls `through_proxy.load_target`
synchronously (`has_one_through_association.rb:19`), which is async in trails, while
`has-one-through-associations.test.ts` ("association build constructor builds through record" and
6 siblings) call `association("club").build()` unawaited and read the through target immediately.
Collapsing `replace` to the Rails shape reds those 7.

## Acceptance criteria

- [ ] `replace` is `createThroughRecord(record, save)` then `this.target = record` (awaited where async), with no pending-replacement state.
- [ ] `_pendingReplace`, `_pendingUnloadedThroughReconcile`, `constructThroughRecordInMemory`, `persistReplace` and the autosave drains for them are deleted.
- [ ] `HasOneThroughAssociation#reset` is deleted with its receipt; has_one :through suites stay green.
