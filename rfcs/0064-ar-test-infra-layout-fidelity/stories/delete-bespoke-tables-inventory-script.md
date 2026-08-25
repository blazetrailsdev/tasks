---
title: "Delete the bespoke-tables-inventory script now the ESLint rule covers it"
status: done
updated: 2026-08-02
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 1
pr: 5901
claim: "2026-08-02T18:07:31Z"
assignee: "delete-bespoke-tables-inventory-script"
blocked-by: null
closed-reason: null
---

## Context

`scripts/bespoke-tables-inventory/inventory.ts` (added by
`drop-bespoke-tables-per-file-like-rails`, PR #5698) is a regex-based on-demand
script measuring where a bespoke table's `dropTable` sits: happy path vs. an
`afterEach`/`afterAll`/`finally`. PR #5701
(`fold-failure-safe-teardown-into-require-table-teardown`) folded that check
into the `blazetrails/require-table-teardown` ESLint rule as its `failureSafe`
option (default on), so it now runs on every commit with a real AST instead of
on demand with regexes — and covers strictly more, since the script only ever
read helper `createTable(...)` calls and never raw `CREATE TABLE` SQL.

The deletion could not ship with #5701: #5698 was still open when that PR
branched from `main`, and stacking is forbidden. #5698 merged
2026-07-31T01:58:30Z, so `scripts/bespoke-tables-inventory/` is now on `main`
with nothing reading it.

The script's five `REVIEWED` allowlist entries are already ported to #5701 as
inline `eslint-disable-next-line blazetrails/require-table-teardown` comments
carrying their reason, except `horses` (`invertible-migration.test.ts`), which
the rule finds already guarded and which needed no suppression. Nothing in the
allowlist is lost by deleting the script.

## Acceptance criteria

- Delete `scripts/bespoke-tables-inventory/`.
- Remove the `bespoke:tables:inventory` script from the root `package.json`.
- Confirm nothing else references either (CI workflows, docs, other scripts).
