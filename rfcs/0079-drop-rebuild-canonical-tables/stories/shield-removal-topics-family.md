---
title: "Remove the topics-family shields (bind-parameter, date, primary-keys, uniqueness)"
status: ready
updated: 2026-07-27
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Shield call sites over `topics` (and companions):

- `packages/activerecord/src/bind-parameter.test.ts:90` (topics, ...)
- `packages/activerecord/src/date.test.ts:30` (topics)
- `packages/activerecord/src/primary-keys.test.ts:33` (topics, ...)
- `packages/activerecord/src/validations/uniqueness-validation.trails.test.ts:98`
  (topics; then adds `topics_direct_index` - that suite itself mutates the
  canonical `topics` shape and must restore or isolate it)

`topics` is one of the most-shared canonical tables; the uniqueness suite's own
addIndex is a contamination source in this very list, so fix that first.

## Acceptance criteria

- The listed `rebuildCanonicalTables` call site(s) are deleted, and the suites stay green when co-scheduled with the full AR suite on sqlite + PG + MySQL/MariaDB (the shield must be unnecessary, not just removed).
- The contaminating sibling is fixed at the source: it restores the canonical shape itself, runs against `fixtures({ ... })` / transactional rollback, or its reshaping moves off the shared canonical tables. Name the culprit and fix in the PR body.
- No test renames; test:compare delta non-negative.
