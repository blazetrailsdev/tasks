---
title: "Phase 1: attribute every rebuildCanonicalTables shield to its contaminating sibling"
status: ready
updated: 2026-07-26
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Mirror of RFC 0070's Phase-1 measurement. Each of the ~29 per-suite
`rebuildCanonicalTables` call sites exists because some sibling file reshapes or
drops those canonical tables on the shared per-worker DB. Before the burndown
stories touch anything, produce the culprit map: for each call site (see the
RFC README baseline list), identify which sibling file leaves the named tables
drifted (grep for `dropTable`/`createTable`/`defineSchema` remnants/`changeTable`
on those tables; the `require-canonical-rebuild` eslint rule's exclude list and
RFC 0070's drift-source table in its README are prior art for several families).

This is a spike/audit story: the deliverable is the recorded inventory
(call site -> table set -> culprit -> proposed fix), appended to the RFC README
or the burndown stories, not a code change. Done when closed with the inventory
recorded.

## Acceptance criteria

- Every call site in the baseline is attributed to a culprit (or recorded as
  genuinely unattributable with the search performed).
- Each burndown story in this RFC gets its culprit list confirmed or corrected.
