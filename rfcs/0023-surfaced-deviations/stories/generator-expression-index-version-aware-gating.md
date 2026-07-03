---
title: "schema-file-generator drops expression indexes on all MySQL (coarse) vs runtime supportsExpressionIndex"
status: claimed
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-03T14:45:50Z"
assignee: "generator-expression-index-version-aware-gating"
blocked-by: null
closed-reason: null
---

## Context

`schema-file-generator.ts` gates expression indexes (Rails `t.index "(...)"`, a
string column with non-word chars) with a coarse `adapterName === "mysql"` skip
(schema-file-generator.ts:178-187) because the generator has no DB version. The
canonical loader's shared `emitTableIndexes` (canonical-schema.ts) instead uses
the runtime `supportsExpressionIndex(adapter)` check, which is TRUE on MySQL
8.0.13+. So on a live MySQL 8 the two diverge: the canonical/fixtures path keeps
the expression index, the boot-laid generator path drops it.

Surfaced by the index-gating parity guard (PR #4471), whose tracked-residual
test pins this divergence (`expression-index gating diverges on MySQL 8`). Safe
today because the only live generator caller is the PG-only template path
(template-global-setup.ts); MySQL builds via the runtime-checked canonical
loader. A future MySQL-template caller would silently drop expression indexes on
MySQL 8.

## Acceptance criteria

- Thread a DB-version-aware expression-index check into `schema-file-generator.ts`
  so it matches `supportsExpressionIndex` semantics (MySQL >= 8.0.13, SQLite >=
  3.9, never MariaDB) instead of the coarse `adapterName === "mysql"` skip.
- The generator has no live adapter, so the version must come from the caller
  (e.g. pass a capability flag / resolved version into `generateSchemaFile`).
- Flip the PR #4471 residual test from asserting divergence to asserting parity
  on MySQL 8 once the gap is closed.
