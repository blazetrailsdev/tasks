---
title: "Delete rebuildCanonicalTables and its FK-scan machinery once callers hit zero"
status: draft
updated: 2026-07-26
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
deps:
  [
    "ratchet-rebuild-canonical-tables-callers",
    "shield-removal-people-locking-dirty",
    "shield-removal-topics-family",
    "shield-removal-migration-values",
    "shield-removal-schema-dumper-booleans",
    "shield-removal-mysql-adapter-suites",
    "shield-removal-misc-singles",
    "retire-setup-second-pool-rebuilds",
  ]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Capstone, mirror of RFC 0070's delete-repair-worker-schema. Once every shield
and helper call site is gone and the ratchet manifest is empty, delete:

- `rebuildCanonicalTables` (`test-helpers/canonical-schema.ts:2360`) and the
  machinery that exists only for it: `foreignKeyDependents`
  (`canonical-schema.ts:2334`), the `scanInbound: true` arm of
  `fkSafeDropPlan`, and `bulkInboundFkHost` (verify no other caller first -
  see `canonical-schema-bulk-inbound-fk.test.ts`).
- Its self-coverage: the rebuild describe blocks in
  `test-helpers/canonical-schema.test.ts` (:68-118),
  `test-helpers/canonical-schema-bulk-inbound-fk.test.ts`, and the rebuild
  tail of `test-helpers/drop-all-tables.test.ts:52`.
- Rework `eslint/require-canonical-rebuild.mjs`: it currently REQUIRES calling
  the helper after a canonical drop; with the helper gone it becomes a plain
  ban on dropping/reshaping canonical tables outside the canonical loader's
  own file, and its exclude json shrinks accordingly.
- Retire the ratchet manifest from ratchet-rebuild-canonical-tables-callers.

## Acceptance criteria

- `git grep rebuildCanonicalTables` returns nothing.
- Full AR suite green on all adapters across repeated co-scheduled CI runs
  (the shield must be provably unnecessary - point at the green runs).
- The reworked lint still blocks a new canonical-table drop-without-restore.
