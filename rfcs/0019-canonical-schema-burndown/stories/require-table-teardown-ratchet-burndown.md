---
title: "Burn down require-table-teardown exclude baseline (18 files)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3123 introduced the `blazetrails/require-table-teardown` ESLint rule:
every `createTable("foo")` in an AR test must have an explicit
`dropTable("foo")` in the same file, and `dropAllTables()` is forbidden
(carpet-bomb teardown). 18 pre-existing violators are grandfathered in
`eslint/require-table-teardown-exclude.json` as a ratchet baseline. This
story burns that list down to zero, mirroring the
require-canonical-schema / expected-fixtures ratchets.

Two categories to triage (drop entries from the exclude JSON as each is fixed):

- **Conservative false-positives — dynamic teardown that functionally cleans
  up.** e.g. `reserved-word.test.ts` drops via
  `for (const t of RESERVED_TABLES) await conn.dropTable(t)` — the rule can't
  match a loop variable to literal-named creates. Either switch to explicit
  literal `dropTable("…")` calls (preferred — makes ownership obvious) or, if
  the loop is genuinely cleaner, keep the file excluded / use a scoped
  `eslint-disable`. Not real leaks.
- **`dropAllTables()` users needing per-table drops.** The 3 files added to
  the baseline when the carpet-bomb ban landed —
  `active-record-schema.test.ts`, `normalized-attribute.test.ts`,
  `statement-cache.test.ts` — must replace `dropAllTables()` with explicit
  `dropTable("…")` for each table they create.
- **Possible real leak:** `query-cache.test.ts` creates `qc_mig_tasks` with no
  literal drop — verify and add teardown.

Rule + baseline live in `eslint/require-table-teardown.{mjs,test.mjs}` and
`eslint/require-table-teardown-exclude.json`. Regenerate-the-baseline recipe:
set the JSON to `[]`, run eslint over `packages/activerecord/src/**/*.test.ts`,
collect the violating files. `test-helpers/**` is exempt by config.

Keep within the 500-LOC PR ceiling — split across multiple PRs from `main`
(non-overlapping files) if needed; do not stack.

## Acceptance criteria

- `eslint/require-table-teardown-exclude.json` reduced toward `[]` (fully, or
  in tranches if split across PRs).
- Each removed file either drops every table it creates by explicit
  `dropTable("…")`, or carries a justified scoped `eslint-disable`.
- No `dropAllTables()` remains in any de-grandfathered file.
- `pnpm vitest run` green for each touched test file on sqlite (CI covers PG/MySQL).
