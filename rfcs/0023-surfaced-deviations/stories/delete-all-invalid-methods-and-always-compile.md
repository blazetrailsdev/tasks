---
title: "delete_all: raise on distinct/with and always compile_delete (structural parity)"
status: done
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 3278
claim: "2026-06-14T18:48:34Z"
assignee: "delete-all-invalid-methods-and-always-compile"
blocked-by: null
---

## Context

Surfaced during PR #3239 (f9h). `Relation#deleteAll` (`relation.ts` ~3403)
diverges structurally from Rails `delete_all` (`relation.rb:1011-1037`):

1. Rails always runs `build_arel` + `compile_delete(key, having, group)`; the TS
   port keeps a plain `DeleteManager` fast path for the unconstrained case and
   only uses `compileDelete` when a limit/offset/order is present. The emitted
   SQL is identical for the unconstrained case, so this is structural, not
   behavioral — but it means two code paths to keep in sync.
2. Rails raises `ActiveRecordError("delete_all doesn't support …")` when
   `INVALID_METHODS_FOR_DELETE_ALL = [:distinct, :with, :with_recursive]` are
   present (`relation.rb:1014-1019`). The TS port has no such guard — a
   `.distinct.deleteAll()` / `.with(...).deleteAll()` silently ignores those
   clauses instead of raising.

## Acceptance criteria

- `deleteAll` raises an `ActiveRecordError`-equivalent when `distinct`, `with`,
  or `withRecursive` values are present, matching Rails' message.
- Decide whether to collapse to a single always-`compileDelete` path (verify no
  snapshot/SQL regressions across the suite) or document why the fast path stays.
- Test names mirror any corresponding Rails `delete_all` cases verbatim.
