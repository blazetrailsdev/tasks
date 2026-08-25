---
title: "naming-burndown-arel-to-sql"
status: done
updated: 2026-08-11
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6358
claim: "2026-08-11T13:36:12Z"
assignee: "naming-burndown-arel-to-sql"
blocked-by: null
closed-reason: null
---

## Context

`packages/arel/src/visitors/to-sql.ts` names the first parameter of nearly every
`visit_*` method `node`. Rails names it `o` in every one of them
(`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb` — e.g. `to_sql.rb:87`
`def visit_Arel_Nodes_Casted o, collector`, `to_sql.rb:588`
`def visit_Arel_Nodes_In(o, collector)`, `to_sql.rb:643`
`visit_Arel_Nodes_Equality`).

This is the residue of the RFC 0096 arel naming burndown (PR #6350). That PR
converged the arel `naming` rows from 109 → 39 and did the same `node` → `o`
rename in the two smaller sibling visitors — `packages/arel/src/visitors/mysql.ts`
and `packages/arel/src/visitors/postgresql.ts` — but `to-sql.ts` is 2171 lines
with ~100 visitor methods, and renaming the parameter across them is roughly
800 LOC on its own, over the PR ceiling. It was deliberately left out rather
than half-done.

Confirm the exact remaining set with:

```bash
API_COMPARE_FORCE=1 pnpm parity:api --calls
node -e 'const d=require("./scripts/api-compare/output/call-arg-mismatches.json");
  console.log(d.mismatches.filter(r => r.class === "naming" && r.tsFile === "visitors/to-sql.ts").length)'
```

Watch for the two identifiers that are NOT the plain parameter rename and must
not be swept up by a blind `\bnode\b` substitution:

- the `import { Node } from "../nodes/node.js"` specifier and the `Nodes.*`
  namespace (both capitalised, so a `\b` word-boundary sed leaves them alone —
  but the `"../nodes/node.js"` path string does NOT, and prose in comments does
  not either; both bit the mysql.ts pass in #6350),
- `compile(node: Node)` and the `const node = this.prepareDeleteStatement(o)`
  local in `visitArelNodesDeleteStatement`, which already sits next to a real
  `o` parameter.

## Acceptance criteria

1. Every `visit_*` / helper method in `packages/arel/src/visitors/to-sql.ts`
   whose Rails counterpart names its first parameter `o` names it `o` too.
2. The `naming` row count for `visitors/to-sql.ts` in
   `pnpm parity:api:calls:args:report` drops accordingly; report before/after in
   the PR body.
3. No public surface changes and no behavior changes — `pnpm parity:api`,
   `pnpm parity:api:extra`, `pnpm parity:api:calls` and
   `pnpm parity:api:calls:args` are all unchanged/green.
4. Rows that are argument-ORDER defects or invented conversions at the call site
   (e.g. `quoteTableName(rubyToS(name))`, `visitArelNodesGrouping`'s
   array-flattening loop) are NOT renamed away — leave the row and file the
   defect against the RFC owning the file.
5. Scoped to `visitors/to-sql.ts` so sibling burndown PRs do not conflict.
