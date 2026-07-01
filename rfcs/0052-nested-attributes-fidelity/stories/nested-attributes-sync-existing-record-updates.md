---
title: "Nested attributes: id-bearing/update_only updates & destroys defer to async flush instead of Rails' synchronous in-memory existing_record handling"
status: blocked
updated: 2026-06-15
rfc: "0052-nested-attributes-fidelity"
cluster: null
deps:
  - nested-attributes-singular-sync-in-memory-target
  - nested-attributes-collection-merge-on-load
  - nested-attributes-collection-sync-in-memory-grandchild
deps-rfc: []
est-loc: 200
priority: 40
pr: null
claim: "2026-06-15T12:20:11Z"
assignee: "nested-attributes-sync-existing-record-updates"
blocked-by: "Decomposed into 3 sub-stories (Phase G exceeds the 300 LOC single-PR ceiling and touches the core async association loader): nested-attributes-singular-sync-in-memory-target, nested-attributes-collection-merge-on-load, nested-attributes-collection-sync-in-memory-grandchild. This umbrella stays as an epic tracker; close it once all three land."
---

## Context

## Acceptance criteria
