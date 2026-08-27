---
title: "Delete rebuildCanonicalTables and its FK-scan machinery once callers hit zero"
status: blocked
updated: 2026-08-27
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
claim: "2026-08-27T18:43:45Z"
assignee: "delete-rebuild-canonical-tables"
blocked-by: "Capstone precondition still unmet on origin/main (re-verified 2026-08-27 refine): rebuildCanonicalTables has 2 live call sites, packages/activerecord/src/migration/exclusion-constraint.test.ts:34 (invoices) and migration/unique-constraint.test.ts:26 (sections), and eslint/rebuild-canonical-tables-callers.json still carries exactly those 2 rows. Both are owned by shield-removal-pg-constraint-suites, now flipped ready (priority 3). Unblock once that lands and the manifest is empty. Note: set-deps is not a CLI verb, so the deps list does not yet name shield-removal-pg-constraint-suites or ban-arunit2-canonical-loader-in-tests."
closed-reason: null
---

## Context

Capstone, mirror of RFC 0070's delete-repair-worker-schema. Once every shield
and helper call site is gone and the ratchet manifest is empty, delete:

Paths re-verified against `origin/main` 2026-08-09 — the helper and its
machinery moved to `packages/activerecord/src/support/canonical-table-rebuild.ts`:

- `rebuildCanonicalTables` (`support/canonical-table-rebuild.ts:299-310`) and the
  machinery that exists only for it: `foreignKeyDependents`, the `scanInbound`
  arm of `fkSafeDropPlan` (`:109-128`), and `bulkInboundFkHost` (`:192`) —
  verify no other caller first, see
  `support/canonical-table-rebuild-bulk-inbound-fk.test.ts`.
- Its self-coverage: `support/canonical-table-rebuild.test.ts` (the
  `describe("rebuildCanonicalTables")` block at `:31`) and
  `support/canonical-table-rebuild-bulk-inbound-fk.test.ts`.
  `support/drop-all-tables.test.ts` is NOT in scope any more — it no longer
  calls the helper, and `dropAllTables` has a live caller
  (`test-setup-dy.ts:87`).
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
