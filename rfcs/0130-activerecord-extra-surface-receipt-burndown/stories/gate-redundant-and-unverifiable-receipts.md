---
title: "Report receipts that cover nothing, sit off the measured surface, or suppress no call flag"
status: done
updated: 2026-09-23
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: 7
pr: trails#8014
claim: "2026-09-23T20:19:01Z"
assignee: "retire-redundant-and-exempt-permanent-receipts"
blocked-by: null
closed-reason: null
---

## Context

The PERMANENT-receipt audit A/B'd every activerecord receipt in bulk by stripping
`noRailsEquivalent` / `noRailsEquivalentInherited` / `fileNoRailsEquivalent` from
`scripts/api-compare/output/ts-api.json` and re-running `buildReport`
(`scripts/api-compare/extra-surface.ts:2578`) — no rebuild per tag. It found
three receipt populations no gate examines:

1. **Tags covering nothing** — 32 names allowed or interface-exempt with the tag
   removed. `gateRedundant` (`extra-surface.ts:2768`) only reports written
   per-name tags a same-file allowed set covers; the scorer checks the tag
   _before_ `collectInterfaceOnlyNames` exemption (`extra-surface.ts:2283-2295`),
   so an exempt name's tag always "matches", and inherited interface members are
   excluded from `redundant` by `!e.inherited` (`:2630`).
2. **Receipts on declarations off the extracted surface** — 19
   `@noRailsEquivalent PERMANENT` tags on module-private functions, type aliases,
   locals and `src/sqlite/**` files never reach `collectTaggedEntries`, so they
   are neither matched, stale nor redundant.
3. **Call receipts on uncompared pairs** — 20 `@missingRailsCall` /
   `@missingRailsArgs` PERMANENT receipts suppress nothing in
   `output/call-mismatches.json` / `call-arg-mismatches.json`, and
   `staleCallTags` (`compare.ts:1934`) skips uncompared pairs by design.

Prior art to extend rather than duplicate: `stale-tag-gate-blind-to-unharvested-declarations`
(RFC 0025, draft) for (2); `convergeable-receipt-story-ids-are-never-resolved`
(RFC 0127) for the dangling-story-id half the audit also measured (42
`CONVERGEABLE` receipts name `done`/`closed` stories; ~54 carry prose instead of
an id).

## Acceptance criteria

- A report (and, once burnt down, a gate) that strips receipts from the manifest
  in memory, re-scores, and lists every receipt whose name is allowed or exempt
  without it — including inherited interface members.
- Receipts on declarations the extractor does not surface are reported as
  unverifiable, per file:line.
- Call/args receipts that suppress no flag are reported whether or not their
  pair was compared.
- Unit tests cover each population against a synthetic manifest.
