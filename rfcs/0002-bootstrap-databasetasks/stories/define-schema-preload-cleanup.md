---
title: "Phase 5 — retire canonical-preload signature machinery"
status: claimed
updated: 2026-06-20
rfc: "0002-bootstrap-databasetasks"
cluster: followup
deps: ["delete-bootstrap-handler"]
deps-rfc: []
est-loc: 150
pr: null
claim: "2026-06-20T01:41:36Z"
assignee: "define-schema-preload-cleanup"
blocked-by: null
priority: 0
---

## Context

Once everything loads via `DatabaseTasks`, the `setCanonicalSchemaPreload` /
`restoreCanonicalSchemaSignatures` machinery in `define-schema.ts` (which keeps
per-file `defineSchema` calls as cache-hit no-ops during the transition) becomes
redundant. Re-evaluate and remove it.

This does NOT introduce a committed `db/schema.ts` dump — `TEST_SCHEMA` (in-memory
TS) remains the long-term source of truth, mirroring Rails' hand-authored
`test/schema/schema.rb`. The generated schema file stays ephemeral runtime glue.

See RFC 0002 §Design (source-of-truth) and §Rollout Phase 5.

## Acceptance criteria

- [ ] Canonical-preload signature machinery removed from `define-schema.ts`
- [ ] Per-file `defineSchema` no-op behavior confirmed unnecessary
- [ ] No committed schema dump introduced; `TEST_SCHEMA` remains source of truth
- [ ] Full suite green

## Notes

Deferred (status `draft`) — re-evaluate after [[delete-bootstrap-handler]]
lands. Separate follow-up, explicitly not bundled into PR 2.
