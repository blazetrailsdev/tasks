---
title: "Initialize locking column from schema default; drop nil guard (converge to optimistic.rb:82)"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 3810
claim: "2026-06-21T12:38:43Z"
assignee: "partial-inserts-locking-column-schema-default-init"
blocked-by: null
---

## Context

Follow-up from PR #3745 (ar-test-suite-partial-inserts-ambient-divergence), per
review of the optimistic-locking partial-insert fix.

`attributesForCreate` (`packages/activerecord/src/attribute-methods.ts`)
force-unions the locking column into the partial-insert candidates, mirroring
Rails `Locking::Optimistic#_create_record` (`optimistic.rb:78-82`). Rails unions
**unconditionally** when `locking_enabled?`. trails adds an extra guard —
`this._readAttribute(mc.lockingColumn) != null` — so it only unions a non-null
in-memory value.

Why the guard exists: Rails initializes the locking column to its schema default
(0) at load time via attribute/schema reflection, so it is never nil for a new
record. Some trails models do not declare the locking column as an `attribute()`
entry (e.g. `LockPersonalLegacyThing` in `locking.test.ts`, custom column
`version`), so `_readAttribute(lockingColumn)` returns null. Forcing a null value
into the INSERT would write explicit NULL and violate a NOT NULL lock column.
The guard omits the column instead, letting the DB default apply — correct
observable result, but a divergent mechanism (Rails would write the reflected 0;
on a nullable column with no DB default Rails writes NULL, trails omits it).

Convergence: initialize the locking column from its schema/DB default at model
load (so a new record's in-memory lock value is never nil), then drop the
`!= null` guard and union unconditionally exactly as `optimistic.rb:82` does.

## Acceptance criteria

- [ ] A new optimistic-locking record's in-memory locking-column value equals
      its schema default (0), even when the column is not declared via
      `attribute()`.
- [ ] Remove the `_readAttribute(lockingColumn) != null` guard in
      `attributesForCreate`; union the locking column unconditionally when
      `lockingEnabled`, matching `optimistic.rb:82`.
- [ ] `locking.test.ts` (incl. "destroy dependents" / `LockPersonalLegacyThing`)
      and the persistence lock_version tests stay green under
      `partial_inserts = true`.
