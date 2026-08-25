---
title: "Remove the migration.test values shields"
status: ready
updated: 2026-07-27
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/migration.test.ts:1652` and `:1677` (re-verified on
`origin/main` 2026-08-09; both still present) rebuild
`values` mid-file. migration.test is itself the biggest canonical reshaper (it
appears in RFC 0070's require-canonical-rebuild exclude backlog) - these two
sites likely shield the file against ITS OWN earlier describe blocks. The fix
is intra-file: make the reshaping blocks restore the canonical shape (or run
on scratch tables), then drop both shields.

## Acceptance criteria

- The listed `rebuildCanonicalTables` call site(s) are deleted, and the suites stay green when co-scheduled with the full AR suite on sqlite + PG + MySQL/MariaDB (the shield must be unnecessary, not just removed).
- The contaminating sibling is fixed at the source: it restores the canonical shape itself, runs against `fixtures({ ... })` / transactional rollback, or its reshaping moves off the shared canonical tables. Name the culprit and fix in the PR body.
- No test renames; parity:test delta non-negative.
