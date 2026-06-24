---
title: "Converge changes_applied dirty-state clearing in attribute-methods writes"
status: in-progress
updated: 2026-06-24
rfc: "0044-call-set-parity-fidelity-burndown"
cluster: real-omission
deps: ["call-mismatches-ratcheting-baseline"]
deps-rfc: []
est-loc: 80
priority: null
pr: 4082
claim: "2026-06-24T19:38:46Z"
assignee: "dirty-tracking-changes-applied-cluster"
blocked-by: null
---

## Context

Three flagged pairs in `packages/activerecord/src/attribute-methods.ts`:
`_touch_row` (missing `clear_attribute_changes`, `changes_applied`),
`_update_record` (missing `changes_applied`), `_create_record` (missing
`changes_applied`). Rails clears dirty state after a write via
`changes_applied` (activerecord/lib/active_record/attribute_methods/dirty.rb
and persistence.rb `_update_record`/`_create_record`). If the TS bodies skip
it, dirty tracking stays "changed" after save — a real behavioral bug.

This is the highest-suspicion cluster: `changes_applied` is core dirty-state
lifecycle, rarely a legitimate restructure.

## Acceptance criteria

- For each of the 3 methods: read the Rails source and the ported TS method;
  determine whether dirty state is actually cleared on the TS write path.
- Real omissions converge to Rails (call `changesApplied` /
  `clearAttributeChanges` at the equivalent point) with a test asserting
  `changed?`/`changes` is empty after the write (match the Rails test name if
  one exists).
- Confirmed equivalents (dirty state cleared via a different call) get a
  baseline entry with justification.
- All 3 entries resolved (fixed or baselined) in `call-mismatches.json`.
