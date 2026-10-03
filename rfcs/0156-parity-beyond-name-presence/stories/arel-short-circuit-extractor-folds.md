---
title: "parity: the arms report's short-circuit projection misreads 26 faithful arel rows (eql narrowing, when-lists, String/Symbol)"
status: done
updated: 2026-10-03
rfc: "0156-parity-beyond-name-presence"
cluster: arms
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8429
claim: "2026-10-03T00:02:05Z"
assignee: "arel-short-circuit-extractor-folds"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=arel` prints a **Short-circuit mismatches** table (the `and` / `or`
projection, kept out of the arm tokens by RFC 0113: `scripts/api-compare/report-arms.ts#SHORT_CIRCUIT_TOKENS`).
On trails `main` @ `0d0353b79e` it lists **41** arel rows. A sampled read of both sides found **26** of them
are faithful ports that the projection misreads, in three shapes. This story fixes the extractor for those
shapes. The 14 real rows are `arel-short-circuit-port-leftovers`; `visitors/visitor.ts#dispatchCache -or`
is `arel-visitor-dispatch-cache-invented-arms`.

### 1. `instanceof` narrowing before a class-equality test — 17 rows, all `+and`

Rails (`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/binary.rb:24-28`):

```ruby
def eql?(other)
  self.class == other.class &&
    self.left == other.left &&
    self.right == other.right
end
```

trails (`packages/arel/src/nodes/binary.ts#eql`):

```ts
return (
  other instanceof Binary &&
  this.constructor === other.constructor &&
  rbEqual(this.left, other.left) &&
  rbEqual(this.right, other.right)
);
```

`other instanceof Binary` only narrows `other` so `other.left` type-checks; `this.constructor ===
other.constructor` already implies it. Rows: `#eql` in `nodes/binary.ts`, `bound-sql-literal.ts`, `case.ts`,
`casted.ts`, `comment.ts`, `cte.ts`, `delete-statement.ts`, `fragments.ts`, `function.ts`,
`homogeneous-in.ts`, `insert-statement.ts`, `nary.ts`, `select-core.ts`, `select-statement.ts`, `unary.ts`,
`update-statement.ts`, and `table.ts`.

### 2. A multi-class `when` list spelled as an `||` chain — 6 rows, 10 `+or`

Ruby's `case x when A, B, C` is one test; trails spells it `x instanceof A || x instanceof B || …`:

- `nodes/casted.ts#buildQuoted` `+or ×5`: `casted.rb:50`, `when Arel::Nodes::Node, Arel::Attributes::Attribute, Arel::Table, Arel::SelectManager, Arel::Nodes::SqlLiteral, ActiveModel::Attribute`
- `visitors/to-sql.ts#visitArelNodesAssignment` `+or +or`: `to_sql.rb:630-641`, `when Arel::Nodes::Node, Arel::Attributes::Attribute, ActiveModel::Attribute`
- `visitors/to-sql.ts#visitArelNodesValuesList` `+or +or`: `to_sql.rb:100-118`, `when Nodes::SqlLiteral, Nodes::BindParam, ActiveModel::Attribute`
- `table.ts#join` and `select-manager.ts#join` `+or`: `table.rb:41-45` / `select_manager.rb:105-109`, `when String, Nodes::SqlLiteral` as `typeof relation === "string" || relation instanceof SqlLiteral`
- `update-manager.ts#set` `+or +or`: `update_manager.rb:19-21`, `when String, Nodes::BoundSqlLiteral`. The TS chain has a third test, `instanceof SqlLiteral`. That is still faithful: `SqlLiteral < String`, so Ruby's `String ===` admits it.

### 3. A String/Symbol pair collapsed onto one JS type — 3 rows

A Ruby Symbol is a JS string (CLAUDE.md, "A Ruby Symbol is a JS string").

- `nodes/window.ts#order` and `#partition` `-or`: `window.rb:14-28`, `String === x || Symbol === x`, is one `typeof x === "string"`.
- `select-manager.ts#group` `+and`: `select_manager.rb:74-83` tests `String ===` then `Symbol ===`; trails' String arm reads `typeof column === "string" && !isSymbol(column)`.

## Acceptance criteria

- [ ] The short-circuit projection discharges each of the three shapes above, each with a unit test in
      `scripts/api-compare/` showing the Ruby and TS skeletons that now agree. The port is not edited.
- [ ] A shape-1 fold applies only when the `instanceof` and the class-equality test name the same operand,
      so a lone `instanceof` guard Rails does not have still reports.
- [ ] A shape-2 fold credits the `||` chain against a `when` list of the same arity. Shape 2's
      `update-manager.ts#set` row is the one exception, and its PR body cites the `String` subclass
      reasoning above.
- [ ] `pnpm parity:api:arms:report --package=arel` lists none of the 26 rows. The repo-wide short-circuit
      count only falls, and the PR body states the before and after.

## Verification

```bash
pnpm build && pnpm parity:api --calls && pnpm parity:api:arms:report --package=arel
pnpm vitest run scripts/api-compare
```
