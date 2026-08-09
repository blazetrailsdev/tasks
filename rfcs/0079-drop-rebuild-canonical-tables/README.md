---
rfc: "0079-drop-rebuild-canonical-tables"
title: "Drive rebuildCanonicalTables call sites to zero, then delete it"
status: draft
created: 2026-07-26
updated: 2026-07-27
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "test-infra"
related-rfcs:
  - "0059-drop-defineschema-mirror-create-table"
  - "0070-drop-repair-worker-schema"
priority: 2
---

## Summary

`rebuildCanonicalTables` (`packages/activerecord/src/support/canonical-table-rebuild.ts`)
is the anti-contamination shield left standing after RFC 0059 (drop
`defineSchema`) and RFC 0070 (delete `repairWorkerSchema`): a victim test file
drop+recreates a named subset of canonical tables at setup because some sibling
file on the shared per-worker DB reshaped or dropped them and never restored
the canonical shape. Like `repairWorkerSchema` before it, every call site is a
paid-per-run patch over a contamination source, plus FK machinery
(`foreignKeyDependents`, `fkSafeDropPlan` with `scanInbound: true`,
`bulkInboundFkHost`) that exists only to make the shield safe.

This RFC drives the call sites to **zero** the same way RFC 0070 did: attribute
each shield to its contaminating sibling, fix the source (restore canonical
shape at the culprit, or move the victim suite onto `fixtures({ ... })` /
transactional rollback so drift cannot reach it), ratchet the caller list so no
new call sites appear, then delete `rebuildCanonicalTables`, its FK-scan
machinery, and its tests, and rework the `require-canonical-rebuild` eslint
rule — which today MANDATES calling the helper after a canonical drop — into a
plain ban on dropping canonical tables outside the helper's own file.

## Baseline

**Re-verified against `origin/main`, 2026-08-09.** The helper moved from
`test-helpers/canonical-schema.ts` to `packages/activerecord/src/support/canonical-table-rebuild.ts`
(with its FK machinery: `foreignKeyDependents`, `fkSafeDropPlan`'s
`scanInbound` arm at `:109-128`, `bulkInboundFkHost` at `:192`), so every
`test-helpers/…` path in the stories below reads `support/…` today.

**26 call sites across 23 files** (down from the 2026-07-26 count of 32/23).
Production-helper callers: `support/setup-second-pool.ts` — **2** sites (`:81`,
`:105`), not 3. Self-coverage that dies with the helper:
`support/canonical-table-rebuild.test.ts`,
`support/canonical-table-rebuild-bulk-inbound-fk.test.ts` (both renamed from
`canonical-schema*.test.ts`). The rest are per-suite shields, grouped in the
burndown stories by table family.

Deltas since the original baseline:

- **Gone:** `base-prevent-writes.test.ts` (professors) no longer calls the
  helper.
- **New, unattributed to any burndown story:**
  `migration/exclusion-constraint.test.ts:34` (`invoices`),
  `migration/rename-table.test.ts:44` (`references`),
  `migration/unique-constraint.test.ts:26` (`sections`). These three arrived
  after the ratchet story was written and are exactly what
  `ratchet-rebuild-canonical-tables-callers` exists to stop; they are folded
  into `shield-removal-misc-singles`.
- `drop-all-tables.test.ts` is no longer a caller, and `dropAllTables` itself
  is no longer dead — `test-setup-dy.ts:87` calls it on the boot full-load arm
  (which is why `delete-dead-drop-all-tables-helper` is closed).
