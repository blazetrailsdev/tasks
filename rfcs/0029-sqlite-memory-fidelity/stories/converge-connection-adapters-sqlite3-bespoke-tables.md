---
title: "converge-connection-adapters-sqlite3-bespoke-tables"
status: in-progress
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5505
claim: "2026-07-28T13:46:57Z"
assignee: "converge-connection-adapters-sqlite3-bespoke-tables"
blocked-by: null
closed-reason: null
---

## Context

Raised in review of #5500 (story `sqlite3-connection-adapter-tests-ambient`).

That PR moved three `connection-adapters/sqlite3*` test files off private
`:memory:` adapters onto the ambient file-backed test connection. Correct per
RFC 0029, but it has a side effect: the bespoke scratch tables those files
create now land in the shared canonical worker DB rather than a throwaway
`:memory:` DB, so CLAUDE.md's "canonical tables only — no bespoke tables" rule
bites harder than it did before.

The bespoke set:

- `connection-adapters/sqlite3-copy-table.test.ts` — `rebuild_users`,
  `rebuild_orders`, `src`, `dst` (plus alterTable's `_alter_tmp_rebuild_users`).
- `connection-adapters/sqlite3-adapter.query-transformers.test.ts` — `widgets`,
  `t`, `a`, `b`.

These are trails inventions; neither file corresponds to a Rails test file.
`sqlite3-copy-table.test.ts` is a unit suite over the _private_ SQLite rebuild
helpers (`tableStructureSql`, `tableStructureWithCollation`, `tableInfo`,
`tableStructure`, `copyTableContents`, `copyTableIndexes`, `copyTable`,
`moveTable`, `alterTable`), which is finer-grained than Rails'
`adapters/sqlite3/copy_table_test.rb`.

Rails drives the same code path off canonical tables: `copy_table_test.rb:9`
takes `@connection = ActiveRecord::Base.lease_connection` and copies
`customers` / `comments` / `developers_projects`. That Rails file is already
ported faithfully at `packages/activerecord/src/adapters/sqlite3/copy-table.test.ts`
(canonical tables via `fixtures(["customers"])`), so the two files overlap in
subject but not in granularity.

## Acceptance criteria

- [ ] Decide and record which of these holds for
      `connection-adapters/sqlite3-copy-table.test.ts`:
      (a) it is redundant with the canonical `adapters/sqlite3/copy-table.test.ts`
      port and should be deleted, or
      (b) its private-helper coverage is not reachable from the canonical port
      and it must be kept — in which case its tables converge onto canonical
      ones (`customers`, `comments`, …) rather than `rebuild_users` / `src` / `dst`.
- [ ] Same decision for the `widgets` / `t` / `a` / `b` tables in
      `connection-adapters/sqlite3-adapter.query-transformers.test.ts`.
- [ ] No bespoke table names remain in either file, or the deviation is
      justified at the call site per
      `feedback_justify_deviations_at_call_site_not_pr_body`.
- [ ] Test names unchanged (`test:compare` matches on them).
