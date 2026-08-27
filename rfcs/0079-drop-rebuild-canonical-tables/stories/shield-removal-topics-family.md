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

Re-verified on `origin/main` 2026-08-09 — all four still present:

- `packages/activerecord/src/bind-parameter.test.ts:90` (topics, ...)
- `packages/activerecord/src/date.test.ts:29` (topics)
- `packages/activerecord/src/primary-keys.test.ts:32` (topics, ...)
- `packages/activerecord/src/validations/uniqueness-validation.trails.test.ts:99`
  (topics; then adds `topics_direct_index` - that suite itself mutates the
  canonical `topics` shape and must restore or isolate it)

`topics` is one of the most-shared canonical tables; the uniqueness suite's own
addIndex is a contamination source in this very list, so fix that first.

## Phase-1 attribution (2026-08-26)

Current lines: `bind-parameter.test.ts:89`, `date.test.ts:29`,
`primary-keys.test.ts:32`, `validations/uniqueness-validation.trails.test.ts:99`.
**Add `dirty.trails.test.ts:21` (topics)** — a fifth `topics` site no story
listed.

All four original sites are group B (no same-file drop). Every culprit their
comments name — `coders/json.test.ts`'s `SerializedTopic`,
`attribute-methods.test.ts` / `finder.test.ts`' bespoke `topics` — is a
`defineSchema` call site and **extinct** since RFC 0059; those files contain no
schema DDL today.

The story's instruction to fix the uniqueness suite's own `topics_direct_index`
first is confirmed: it is the only live `topics` _shape_ mutator. Before
deleting, rule out the residual column-cache drift from
`transactions.test.ts:1685-1700`, `persistence.test.ts:381-390` and
`support/schema-cache-dump.trails.test.ts:73-115`, which `addColumn` +
`removeColumn` canonical `topics` in place — see the RFC README inventory.

## Acceptance criteria

- The listed `rebuildCanonicalTables` call site(s) are deleted, and the suites stay green when co-scheduled with the full AR suite on sqlite + PG + MySQL/MariaDB (the shield must be unnecessary, not just removed).
- The contaminating sibling is fixed at the source: it restores the canonical shape itself, runs against `fixtures({ ... })` / transactional rollback, or its reshaping moves off the shared canonical tables. Name the culprit and fix in the PR body.
- No test renames; parity:test delta non-negative.
