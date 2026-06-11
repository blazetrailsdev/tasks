---
title: "Verify arel-AST convergence: test:compare / api:compare deltas ≥ 0"
status: draft
updated: 2026-06-10
rfc: "0022-relation-arel-ast-convergence"
cluster: verify
deps: ["cte-build-with-expression-ast", "set-operations-bind-threading", "pluck-from-cte-threading"]
deps-rfc: []
est-loc: 120
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Final verification story for the RFC. After the three clusters land
(CTE/UnionAll AST, set-ops as arel nodes + bind threading, FROM-on-manager +
pluck threading), confirm the conversion is parity-neutral-or-positive and that
no string-assembly remnants were left behind.

## Scope

- Run `test:compare` for the touched Rails counterparts — `relation/with_test.rb`,
  the relation union/intersect/except cases, `relation/from_test.rb` — and confirm
  the matched-test delta is **≥ 0** vs the pre-RFC baseline (no test renames, so
  name-matching is stable).
- Run `api:compare` and confirm the activerecord relation API surface delta is
  **≥ 0** (no methods dropped; `build_from`/`build_with_expression_from_value`
  coverage improved).
- Grep the relation read path for residual string assembly that this RFC set out
  to remove and confirm each is gone or justified:
  - `.join(" UNION ALL ")` / `.join(" UNION ")` in `resolveCteEntry`.
  - the `_setOperation` operator-string map and `rightSql.replace(/\$(\d+)/g, …)`
    renumber in `_toSql`.
  - the `sql.replace(/FROM …/, …)` rewrite.
- Spot-check SQLite vs PG vs MySQL emitted SQL for one query per cluster (paren
  handling, `$N` numbering).

## Acceptance criteria

- [ ] `test:compare` delta ≥ 0 for `with_test.rb`, the set-op relation cases, and
      `from_test.rb`.
- [ ] `api:compare` delta ≥ 0 for the relation surface.
- [ ] The three string-assembly sites are removed (or each remaining use is
      documented with a reason).
- [ ] Cross-adapter spot-check passes (SQLite no-paren / Grouping-strip; PG `$N`
      global numbering; MySQL backtick quoting + `?` ordering).

## Notes

- This is a verification-only story — no behavior changes. If a delta is negative,
  file the regression against the responsible cluster story rather than patching
  here.
