---
title: "Revisit skipped statement-cache find/find_by tests now that find routes through cachedFindByStatement"
status: draft
updated: 2026-06-15
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3401 removed the `preparedStatements` gate on `Core.find` / `find_by`, so both
now route through `cachedFindBy` → `cachedFindByStatement` (core.ts), populating
the per-class `_findByStatementCache` `{true, false}` buckets — matching Rails
`core.rb:267,404`.

This invalidates the skip rationale on two `it.skip` tests in
`packages/activerecord/src/bind-parameter.test.ts`:

- `statement cache with find` — comment claims "`find` does not route through
  `cached_find_by_statement` … so the per-class statement cache is never
  populated." That is now FALSE; find populates it.
- `statement cache with find by` — same stale rationale ("see 'statement cache
  with find'").

Both pointed at `f9-statement-cache-pool-introspection` (RFC 0016), which is now
`done`, so the reference is also orphaned. The remaining genuine blocker for these
and the sibling skips (`statement cache`, `statement cache with query cache`,
`statement cache with in clause`, `statement cache with sql string literal`,
`binds are logged`) is the adapter-uniform statement-pool introspection accessor
(Rails' `@statements.send(:cache)` / `sql_key`) — sqlite keys a plain Map by SQL,
PG/MySQL use a StatementPool with adapter-specific keying.

Rails refs: bind_parameter_test.rb (the `statement cache*` cases), core.rb:267,404.

## Acceptance criteria

- Re-evaluate the `statement cache with find` / `statement cache with find by`
  skips now that find/find_by populate `_findByStatementCache`; un-skip whatever
  is testable without pool introspection, or rewrite the skip rationale to cite
  the actual remaining blocker (pool-introspection accessor) and a live tracking
  story — not the closed f9 one.
- Provide the adapter-uniform statement-pool introspection accessor if that is the
  chosen path, OR split it into its own story and re-point the remaining skips.
- Test names unchanged (test:compare matching).
- No stubs.
