---
title: "arel: converge the 41 short-circuit projection rows the arm verdicts do not read"
status: closed
updated: 2026-10-03
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by arel-short-circuit-extractor-folds (26 faithful rows: eql instanceof narrowing x17, when-list as || chain x6, String/Symbol on one JS type x3) and arel-short-circuit-port-leftovers (14 real rows: ?? for Ruby defaults, hand-rolled truthiness, invented fallbacks); the 41st row, visitor.ts#dispatchCache -or, went with arel-visitor-dispatch-cache-invented-arms (trails#8424). Same 41 rows split by per-row verdict (operator decision 2026-10-02)"
---

## Context

The RFC 0172 close-out (`arel-parity-100-close-out`) found arel at 0 arm mismatches
(`pnpm parity:api:arms:report --package=arel`: 0 mismatched pairs over 391 compared). The report's
separate **short-circuit projection** (`compareShortCircuits`, `scripts/api-compare/report-arms.ts`)
still lists 41 arel pairs whose `or` / `and` multiset differs from Rails. Nothing gates on it, and
RFC 0178 leaves it out of scope for activerecord, so without this story nobody owns these rows.

They fall into three groups. Each row needs a verdict: converge the body, or fix the extractor with a
unit test where the row is a measurement artifact.

1. **`eql` type guard (`+and`), 17 sites.** Rails' `eql?` opens with `self.class == other.class &&`
   (`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/binary.rb:24-28`). The TS bodies add an
   `other instanceof X &&` narrowing ahead of `this.constructor === other.constructor`
   (`packages/arel/src/nodes/binary.ts:52-59`). Sites: `nodes/binary.ts`, `bound-sql-literal.ts`,
   `case.ts`, `casted.ts`, `comment.ts`, `cte.ts`, `delete-statement.ts`, `fragments.ts`,
   `function.ts`, `homogeneous-in.ts`, `insert-statement.ts`, `nary.ts`, `select-core.ts`,
   `select-statement.ts`, `unary.ts`, `update-statement.ts`, `table.ts`. The constructor check already
   implies the `instanceof`, so the narrowing could be a cast.
2. **`= nil` default spelled `?? null` (`+or`).** For example `InsertManager#initialize(table = nil)`
   (`insert_manager.rb:5-7`) is `new InsertStatement(table ?? null)` (`insert-manager.ts:12-15`). Also
   `nodes/bound-sql-literal.ts#constructor`, `named-function.ts#constructor`,
   `sql-literal.ts#constructor`, `select-manager.ts#constructor`, `table.ts#alias`.
3. **Other.** These need a per-site read against Rails:
   `nodes/bound-sql-literal.ts#inspect`, `nodes/casted.ts#buildQuoted` (+or ×5),
   `nodes/homogeneous-in.ts#procForBinds`, `select-manager.ts#group` / `#join` / `#distinct` /
   `#distinctOn` / `#collapse`, `table.ts#join`, `tree-manager.ts#where`, `update-manager.ts#set`
   (+or ×2), `visitors/to-sql.ts#visitArelNodesValuesList` / `#visitArelNodesSelectCore` /
   `#visitArelNodesAssignment` (+or ×2 each), `visitors/visitor.ts#visit` / `#dispatchCache`.
   `nodes/window.ts#order` / `#partition` show `-or`: Rails' `String === x || Symbol === x`
   (`window.rb:14-28`) collapses to one `typeof x === "string"` because a Ruby Symbol is a JS string
   (CLAUDE.md § "Ruby idioms that do not translate literally"). That pair is an extractor row, not a
   port bug.

## Acceptance criteria

- [ ] `pnpm parity:api:arms:report --package=arel` short-circuit projection: 0 arel pairs, or each
      remaining pair has an extractor fix with a unit test showing why it is not a divergence.
- [ ] No new receipt, baseline row or mark entry.

## Verification

```bash
pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:arms:report --package=arel --top=100
```
