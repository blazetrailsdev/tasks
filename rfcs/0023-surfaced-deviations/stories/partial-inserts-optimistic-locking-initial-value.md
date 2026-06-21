---
title: "Optimistic-locking column dropped under partial_inserts=true (StaleObjectError)"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-21T13:10:41Z"
assignee: "partial-inserts-optimistic-locking-initial-value"
blocked-by: null
---

## Context

Surfaced auditing the AR-test partial_inserts ambient (RFC 0023
ar-test-suite-partial-inserts-ambient-divergence). Under Rails' test ambient
`partial_inserts = true`, optimistic-locking models drop the locking column
from the INSERT (it equals its default and is "unchanged"), so the in-memory
value (0) and the DB value can disagree; every later update's
`WHERE lock_version = ?` then matches zero rows and raises `StaleObjectError`.

Rails handles this in `Locking::Optimistic#_create_record`
(`attribute_names |= [locking_column]`). In trails the threading is broken:
`base.ts` (~3034-3036) recomputes the create column list from scratch and
`attributesForCreate` (`attribute-methods.ts` ~531-541) discards the passed
names under partialInserts, using `changedAttributeNamesToSave` directly — so
the force-union never reaches column selection.

Verified fix sketch (union the locking column into the partial-insert
candidates), but it MUST guard on a non-null in-memory value:

```ts
if (
  mc.lockingEnabled &&
  this._readAttribute?.(mc.lockingColumn) != null &&
  !candidates.includes(mc.lockingColumn)
) {
  candidates = [...candidates, mc.lockingColumn];
}
```

A naive always-union regresses `locking.test.ts` "destroy dependents"
(`OptimisticLockingWithSchemaChangeTest`, model `LockPersonalLegacyThing`,
custom locking column `version`) to a NOT NULL violation, because that column
has a NULL in-memory value and no schema default — it must fall through to the
DB default. (That NULL in-memory value is itself a likely sub-gap: Rails
initialises the lock column to 0.)

Tests that fail under the Rails ambient (pass once fixed), in
`packages/activerecord/src/persistence.test.ts`:

- "update attribute does not invoke callbacks"
- "update attribute does not autoincrement lock version"

Prerequisite for flipping the AR-test ambient to match Rails' test suite.

## Acceptance criteria

- [ ] A new optimistic-locking record writes its initial lock version under
      `partial_inserts = true` (in-memory and DB agree).
- [ ] The two persistence.test.ts lock_version tests pass with
      `partial_inserts = true`.
- [ ] `locking.test.ts` (incl. "destroy dependents" / custom `version` column)
      stays green.
