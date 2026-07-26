---
title: "Remove the single-table shields (professors, comments, children, authors/books, numeric_data, posts, reserved words, cpk)"
status: draft
updated: 2026-07-26
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The remaining per-suite shields, one call site each:

- `base-prevent-writes.test.ts:89` (professors, on the ARUnit2 pool)
- `delegated-type.test.ts:56` (comments, ...)
- `associations/required.test.ts:25` (children - RFC 0070 drift source #3)
- `view.test.ts:48` (authors, books)
- `enum.trails.test.ts:425` (numeric_data)
- `unsafe-raw-sql.test.ts:29` (posts, comments)
- `reserved-word.test.ts:107` (CANONICAL_RESERVED_TABLES - RFC 0070 drift
  source #1; that suite was the top culprit AND is a victim)
- `primary-keys.test.ts:549` (cpk_books, cpk_orders, cpk_authors)

Split across PRs if the fixes exceed the 500-LOC ceiling; per-site removals
are independent. Use the Phase-1 inventory to fix each culprit at the source.

## Acceptance criteria

- The listed `rebuildCanonicalTables` call site(s) are deleted, and the suites stay green when co-scheduled with the full AR suite on sqlite + PG + MySQL/MariaDB (the shield must be unnecessary, not just removed).
- The contaminating sibling is fixed at the source: it restores the canonical shape itself, runs against `fixtures({ ... })` / transactional rollback, or its reshaping moves off the shared canonical tables. Name the culprit and fix in the PR body.
- No test renames; test:compare delta non-negative.
