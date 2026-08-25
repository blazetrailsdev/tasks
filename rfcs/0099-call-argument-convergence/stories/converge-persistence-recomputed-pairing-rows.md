---
title: "Converge the four persistence.ts rows the ClassMethods/instance pairing recompute surfaced"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6428
claim: "2026-08-12T17:36:52Z"
assignee: "converge-collection-proxy-rich-reflection-re-resolve"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6418: adding the instance-side `_createRecord` / `_updateRecord`
to `persistence.ts` recomputed that file's ClassMethods/instance pairing, and
four rows appeared on bodies the PR never touched. They are pre-existing
divergence the pairing recompute measured, not new work, and they now sit in
`scripts/api-compare/call-mismatches-exclude/activerecord/persistence.json`
with a shared placeholder-free reason that says exactly that.

Each against `vendor/rails/activerecord/lib/active_record/persistence.rb`:

- `_delete_record` → `new(ref:arelTable)` (`kind: "args"`). Rails builds
  `Arel::DeleteManager.new(arel_table)`; the port passes a different argument
  list to the manager constructor.
- `apply_scoping?` → `global_current_scope()` (`kind: "args"`).
- `build_default_constraint` → `default_scoped(kwargs{allQueries=bool:true})`
  (`kind: "args"`) — Rails spells the kwarg `all_queries: true`.
- `_raise_record_not_destroyed` → `order:constructor,primaryKey` (call-set
  order row).

Read each Ruby body before touching the TS one — the rows are keyed by call
name, so the Ruby site is one grep away in that file.

## Converged shape

Each call site passes what the Rails body passes, verified against the vendored
`persistence.rb` line, and the four rows are deleted.

## Acceptance criteria

- [ ] All four rows deleted by hand from `persistence.json` (only-shrink; never
      `--write`), with no new rows added.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] Persistence and relation suites stay green.
