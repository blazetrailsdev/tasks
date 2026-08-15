---
title: "wave-3a-sqlite3-adapter"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6567
claim: "2026-08-15T15:15:04Z"
assignee: "wave-3a-sqlite3-adapter"
blocked-by: null
closed-reason: null
---

# Wave 3a: sqlite3-adapter.ts — 27 call-set rows

## Context

Split out of `wave-3-adapters` (RFC 0106), which shipped
`connection-adapters/abstract-adapter.ts` and
`connection-adapters/abstract/schema-statements.ts` in PR #TBD and left the three
concrete adapter files as their own stories (the parent story's own Notes say
"125 rows across five files is 3-5 PRs. Split per file and file each as its own
story").

`scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/sqlite3-adapter.json`
carries 33 `kind: "set"` rows; the live compare reports 27 mismatched methods.
Read them with:

```bash
API_COMPARE_FORCE=1 pnpm parity:api --calls
# then scripts/api-compare/output/call-mismatches.json, tsFile
#   connection-adapters/sqlite3-adapter.ts
```

Highlights (Rails file is
`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb`):

- `remove_index` omits `index_exists?`, `index_name_for_remove` and `exec_query`.
- `foreign_keys` omits `internal_exec_query` and `extract_foreign_key_action`.
- `table_info` omits `quote_table_name` and `internal_exec_query` — overlaps
  RFC 0077 (quoting-binds-fidelity).
- `initialize` / `configure_connection` omit `merge` / `fetch` — overlaps
  RFC 0094 (sqlite3-adapter-construction-fidelity).
- `copy_table` and `remove_foreign_key` are `order:` rows (right calls, wrong
  order).

## Coordinate, do not collide

RFC 0076 (execute-primitive-convergence), RFC 0077 and RFC 0094 hold open
stories over this file. Read the owning story before converging a row it is
about; if the row IS the fix, converge it and close that story with a pointer.

## Acceptance criteria

- [ ] Every `sqlite3-adapter.ts` row is converged, or carries a reviewed
      one-line `reason` / `@missingRailsCall` at the call site.
- [ ] No `current_adapter?` arm dropped.
- [ ] Rows deleted by hand from the shard; stale marks fixed with
      `pnpm parity:api:calls:tighten activerecord/connection-adapters/sqlite3-adapter.json`.
      No `--write`, no reseed.
- [ ] `pnpm parity:api:calls` green; in-scope count falls.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
