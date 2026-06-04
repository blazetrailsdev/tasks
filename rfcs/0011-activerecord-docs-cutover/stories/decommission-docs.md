---
title: "Delete migrated AR docs + trim docs/index.md AR rows"
status: draft
rfc: "0011-activerecord-docs-cutover"
cluster: decommission
deps:
  - "migrate-ar-test-compare"
  - "migrate-ar-followups"
  - "migrate-adapter-ci"
  - "migrate-fixtures"
  - "migrate-schema-ts"
deps-rfc: []
est-loc: 50
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Once every `docs/activerecord/*` doc's actionable content is represented in a
merged, reconciled RFC, delete the docs. This lands in the **trails** repo. See
RFC 0011 §Phase 3.

## Acceptance criteria

- [ ] Every migrated `docs/activerecord/*` doc deleted (the 14 in the
      disposition table). No stub pointers left behind.
- [ ] `docs/activerecord/parity-verification.md` retained.
- [ ] `docs/index.md` edited to drop its AR rows (file kept — it still indexes
      non-AR docs).
- [ ] A doc is only deleted after its target RFC is merged + reconciled
      (enforced by this story's deps).

## Notes

Trails PR; respects the 500-LOC ceiling (deletions count, but this is mostly
removals). Pair with `repoint-references` in sequence.
