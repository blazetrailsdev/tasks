---
title: "RFC from 3 fixtures docs"
status: draft
rfc: "0011-activerecord-docs-cutover"
cluster: migrate
deps: ["reconcile-existing-rfcs"]
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The fixtures-adoption effort spans three docs: `defineschema-to-fixtures-
migration.md`, `fixtures-adoption-inventory.md`, and `fixtures-migration-
backlog.md`. Consolidate the actionable backlog into one RFC. See RFC 0011
§Phase 2.

## Acceptance criteria

- [ ] New RFC authored from the three docs via the placeholder → PR flow.
- [ ] The migration inventory / backlog → dep-aware stories; the
      excluded-file rationale (blocked migrations) preserved in §Deferred.
- [ ] Memory facts on resolved/blocked fixture migrations cross-checked so
      already-migrated files aren't re-storied.
- [ ] All three docs queued for deletion in `decommission-docs`.

## Notes

Many fixture migrations are recorded done/blocked in the memory index (HABTM,
callbacks, length-validation, query-logs, etc.) — reconcile against those.
