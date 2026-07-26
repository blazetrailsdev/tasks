---
title: "Remove the schema-dumper booleans shield"
status: draft
updated: 2026-07-26
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

`packages/activerecord/src/schema-dumper.test.ts:1078` rebuilds `booleans` (+
companions). schema-dumper.test was the largest dropper in RFC 0070's exclude
backlog (7 drops) and has a PG dump-timeout flake history; verify from the
Phase-1 inventory whether the shield guards against its own earlier drops or a
sibling, fix the source, and delete the shield.

## Acceptance criteria

- The listed `rebuildCanonicalTables` call site(s) are deleted, and the suites stay green when co-scheduled with the full AR suite on sqlite + PG + MySQL/MariaDB (the shield must be unnecessary, not just removed).
- The contaminating sibling is fixed at the source: it restores the canonical shape itself, runs against `fixtures({ ... })` / transactional rollback, or its reshaping moves off the shared canonical tables. Name the culprit and fix in the PR body.
- No test renames; test:compare delta non-negative.
