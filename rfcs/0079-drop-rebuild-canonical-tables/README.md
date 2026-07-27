---
rfc: "0079-drop-rebuild-canonical-tables"
title: "Drive rebuildCanonicalTables call sites to zero, then delete it"
status: draft
created: 2026-07-26
updated: 2026-07-27
owner: "@your-handle"
packages:
  - "activerecord"
clusters:
  - "test-infra"
related-rfcs:
  - "0059-drop-defineschema-mirror-create-table"
  - "0070-drop-repair-worker-schema"
priority: 3
---

## Summary

`rebuildCanonicalTables` (`packages/activerecord/src/test-helpers/canonical-schema.ts:2360`)
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

## Baseline (2026-07-26)

32 call sites across 23 files. Production-helper callers: `setup-second-pool.ts`
(3 sites). Self-coverage that dies with the helper: `canonical-schema.test.ts`,
`canonical-schema-bulk-inbound-fk.test.ts`, `drop-all-tables.test.ts`. The rest
are per-suite shields, grouped in the burndown stories by table family.
