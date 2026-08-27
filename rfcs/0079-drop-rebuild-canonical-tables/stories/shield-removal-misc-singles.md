---
title: "Remove the single-table shields (professors, comments, children, authors/books, numeric_data, posts, reserved words, cpk)"
status: in-progress
updated: 2026-08-27
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 7118
claim: "2026-08-27T13:28:57Z"
assignee: "require-canonical-rebuild-restore-arm-fails-open"
blocked-by: null
closed-reason: null
---

## Context

The remaining per-suite shields, one call site each. Re-verified against
`origin/main` 2026-08-09:

- `delegated-type.test.ts:55` (comments, ...)
- `associations/required.test.ts:21` (children - RFC 0070 drift source #3)
- `view.test.ts:47` (authors, books)
- `enum.trails.test.ts:424` (numeric_data)
- `unsafe-raw-sql.test.ts:28` (posts, comments)
- `reserved-word.test.ts:105` (CANONICAL_RESERVED_TABLES - RFC 0070 drift
  source #1; that suite was the top culprit AND is a victim)
- `primary-keys.test.ts:552` (cpk_books, cpk_orders, cpk_authors)
- `migration/exclusion-constraint.test.ts:34` (invoices) — NEW since the
  baseline
- `migration/rename-table.test.ts:44` (references) — NEW since the baseline
- `migration/unique-constraint.test.ts:26` (sections) — NEW since the baseline

**Gone:** `base-prevent-writes.test.ts` (professors) no longer calls the helper;
drop it from the list. The three `migration/*` sites arrived after this story
was written and are folded in here.

Split across PRs if the fixes exceed the LOC ceiling; per-site removals
are independent. Use the Phase-1 inventory to fix each culprit at the source.

## Phase-1 attribution (2026-08-26)

Current lines: `delegated-type.test.ts:55`, `associations/required.test.ts:21`,
`view.test.ts:47`, `enum.trails.test.ts:425`, `unsafe-raw-sql.test.ts:28`,
`reserved-word.test.ts:105`, `primary-keys.test.ts:563`,
`migration/exclusion-constraint.test.ts:34`, `migration/rename-table.test.ts:44`,
`migration/unique-constraint.test.ts:26`.

**Group A (self-drops — fix the drop, not the shield):**

- `associations/required.test.ts:21` — its own `beforeAll:14-17` `force`-creates
  `parents`/`children`, `afterAll:20` drops them. Move onto bespoke names.
- `reserved-word.test.ts:105` — its own `afterAll:102` drops `values`, `group`,
  `distinct_select`, `distinct`, `select`, `order`. Converge onto
  `fixtures({ ... })`.
- `migration/exclusion-constraint.test.ts:34` — own `beforeEach:26`
  `force`-creates bespoke `invoices(start_date, end_date)`.
- `migration/unique-constraint.test.ts:26` — own `beforeEach:19` `force`-creates
  bespoke `sections(position)`.
- `migration/rename-table.test.ts:44` — own `:53-54` renames canonical
  `references` → `old_references`. Rails renames only its own
  `octopi`/`test_models`; the `references` arm is trails-added.

**Group B (no attributable culprit — strongest deletion candidates):**
`delegated-type.test.ts:55`, `view.test.ts:47`, `enum.trails.test.ts:425`,
`unsafe-raw-sql.test.ts:28`, and the cpk prelude at `primary-keys.test.ts:563`.
The repo-wide scan found **no** schema-mutating call on `entries`, `messages`,
`recipients`, `accounts`, `cpk_books`, `cpk_orders` or `cpk_authors`, and the
`posts`/`books` culprits these comments describe are `defineSchema` sites
extinct since RFC 0059.

## Acceptance criteria

- The listed `rebuildCanonicalTables` call site(s) are deleted, and the suites stay green when co-scheduled with the full AR suite on sqlite + PG + MySQL/MariaDB (the shield must be unnecessary, not just removed).
- The contaminating sibling is fixed at the source: it restores the canonical shape itself, runs against `fixtures({ ... })` / transactional rollback, or its reshaping moves off the shared canonical tables. Name the culprit and fix in the PR body.
- No test renames; parity:test delta non-negative.
