---
title: "Phase 1 — PG CREATE DATABASE ... TEMPLATE"
status: claimed
updated: 2026-06-10
rfc: "0008-test-perf-template-clone"
cluster: test-perf
deps: ["phase0-sqlite-template-spike"]
deps-rfc: []
est-loc: 150
pr: null
claim: "2026-06-10T13:40:36Z"
assignee: "phase1-pg-template"
blocked-by: null
---

## Context

Extend the template-clone model to PostgreSQL: `globalSetup` creates the template
DB, each advisory slot clones via `CREATE DATABASE slot_n TEMPLATE
ar_test_template` (requires no active connections to the template at clone time;
fits the advisory-slot model in `test-setup-worker-db.ts`).

See RFC 0008 §Phases beyond the spike (Phase 1).

## Acceptance criteria

- [ ] `globalSetup` creates the PG template DB
- [ ] Each slot clones via `CREATE DATABASE ... TEMPLATE ar_test_template`
- [ ] No active connections to the template at clone time
- [ ] PG suites green; wall-clock improvement reported

## Notes

Status `draft` — gated on the [[phase0-sqlite-template-spike]] proving the model.
