---
title: "Restore belongs_to inverse-seed regression guard with resolveModel spy"
status: ready
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3613 moved `Association#checkKlass()` to the constructor (matching Rails'
`Association#initialize → check_validity!` timing). This required registering
`CompositePkParent` in
`packages/activerecord/src/associations/belongs-to-inverse-seed-composite-pk.test.ts`
(Rails-equivalent: autoloading always makes classes accessible).

That registration weakened the original RFC 0022 regression guard: the test
previously proved that `staleState() → foreignKeyNames() → associationPrimaryKeys`
reads the PK from the **held instance**, not the registry. Now that
`CompositePkParent` is always registered, a future regression where
`associationPrimaryKeys(null)` forces a registry lookup instead of reading from
the instance would pass silently.

The fix: add a `vi.spyOn(associationsModule, "resolveModel")` around the
`setTarget` call and assert it is **not** called. This restores the original
discriminating power of the guard without requiring the class to be unregistered.

Relevant file: `packages/activerecord/src/associations/belongs-to-inverse-seed-composite-pk.test.ts`
Rails mirror: none (trails-only regression guard).

## Acceptance criteria

- A new `it` in the existing `describe` block spies on `resolveModel` (from
  `"../associations.js"`), calls `child.association("compositePkParent").setTarget(parent)`,
  and asserts `resolveModel` was **not** called during the `setTarget + staleState` path.
- The spy is restored after the test (use `vi.restoreAllMocks()` or `mockRestore()`).
- Existing tests in the file continue to pass.
