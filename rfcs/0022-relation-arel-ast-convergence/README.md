---
rfc: "0022-relation-arel-ast-convergence"
title: "Relation arel-AST convergence — replace string-based SQL assembly with Arel nodes (CTE/UnionAll, set-ops, FROM)"
status: closed
created: 2026-06-10
updated: 2026-07-06
owner: "@deanmarano"
packages:
  - activerecord
  - arel
clusters:
  - cte
  - set-ops
  - from
  - verify
---

<!-- Unnumbered until merge: keep `rfc:` as 0022-relation-arel-ast-convergence
     and the H1 below number-free. `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. Never use a `draft-` prefix. -->

# RFC 0022 — Relation arel-AST convergence

## Summary

Three corners of the trails relation query builder still assemble SQL by
**string manipulation of already-compiled SQL** instead of composing an Arel AST
and letting the visitor emit SQL + binds, the way Rails does. This RFC converts
those three clusters to the arel-AST mechanism, mirroring Rails'
`active_record/relation/query_methods.rb` exactly:

1. **CTE / `with` / `with_recursive`** — array sub-queries are joined with a
   literal `" UNION ALL "` string instead of reduced into `Arel::Nodes::UnionAll`
   nodes, and `_ctes` stores raw SQL strings rather than arel expressions.
2. **Set operations** (`union` / `unionAll` / `intersect` / `except`) — each side
   is compiled to SQL independently and string-concatenated, with the right
   side's `$N` PG bind placeholders **regex-renumbered** to avoid collisions.
3. **`from()` rewrite** — the FROM clause is applied by **regex-replacing** the
   `FROM …` substring of the compiled SQL, which is also why `pluck` ignores
   `from()` / CTEs entirely.

In all three cases the Arel infrastructure to do this the Rails way **already
exists** in `packages/arel` (the `UnionAll`/`Union`/`Intersect`/`Except` nodes,
their visitors with correct cross-adapter paren handling, and
`SelectManager#unionAll`/`union`/`intersect`/`except`/`from`). The work is to
route the activerecord relation through that AST instead of post-processing
strings.

## Motivation

The trigger is **PR #3105** (`port relation/with to canonical …`). That PR
ported `relation/with.test.ts` to the canonical schema and, in doing so, made
the **minimal** correctness fix for array-form CTEs — changing the sub-query
join from `" UNION "` to `" UNION ALL "` so duplicate rows across the parts are
preserved (matching Rails' `build_with_expression_from_value` →
`Arel::Nodes::UnionAll`). Its description explicitly documents the remaining gap
as a follow-up:

> - `pluck` does not thread `from()`/CTE clauses (it projects off the model's
>   arel_table) … the id-set assertions go through `order("id").toArray()` + id
>   extraction rather than `pluck(:id)`.

That `pluck` deviation is a direct symptom of the string-based FROM rewrite, and
the `" UNION "`/`" UNION ALL "` fix is a string-level patch over a missing AST
node. This RFC closes the underlying gaps.

### Current state (verified on `main`, 2026-06-10)

**Cluster 1 — CTE.** `packages/activerecord/src/relation/query-methods.ts`,
`resolveCteEntry` (~L225–266): for an array CTE value it maps each sub-query to
`q.toSql()` and `.join(" UNION ")` (PR #3105 changes this to `" UNION ALL "`).
`_ctes` is typed `Array<{ name; sql; recursive }>` — **SQL strings**. `buildWith`
(~L2492) wraps each as `new Nodes.Cte(c.name, arelSql(c.sql))` — i.e. the string
is re-wrapped in a `SqlLiteral` and handed to the visitor. Rails'
`build_with_expression_from_value` (`query_methods.rb` L1929) instead:

```ruby
when Arel::Nodes::SqlLiteral then Arel::Nodes::Grouping.new(value)
when ActiveRecord::Relation
  nested ? value.arel.ast : value.arel
when Arel::SelectManager then value
when Array
  return build_with_expression_from_value(value.first, false) if value.size == 1
  parts = value.map { |q| build_with_expression_from_value(q, true) }
  parts.reduce { |result, v| Arel::Nodes::UnionAll.new(result, v) }
```

i.e. single-element arrays **unwrap**, multi-element arrays **reduce into nested
`UnionAll` nodes**, Relations contribute `value.arel` (or `.ast` when nested),
and a `SqlLiteral` becomes a `Grouping`.

**Cluster 2 — set ops.** `packages/activerecord/src/relation.ts`, `_toSql`
(~L3830–3858): when `_setOperation` is set it compiles `leftSql` and `rightSql`
**independently**, concatenates `_lastSelectBinds` from both sides, picks an
operator string from `{ union: "UNION", unionAll: "UNION ALL", intersect:
"INTERSECT", except: "EXCEPT" }`, then **regex-renumbers** the right side's `$N`
placeholders (`rightSql.replace(/\$(\d+)/g, …)`) so the combined statement has
globally-unique PG bind numbers, and finally string-templates the paren
difference (`sqlite` → no parens; PG/MySQL → `(left) OP (right)`). The
`union`/`unionAll`/`intersect`/`except` spawn methods (relation.ts L1292–1328)
just stash `{ type, other }` in `_setOperation`. Rails composes the corresponding
`Arel::Nodes::Union`/`UnionAll`/`Intersect`/`Except` (defined in
`arel/lib/arel/nodes/binary.rb`) and lets the visitor emit both SQL and binds —
no string concat, no manual renumbering.

**Cluster 3 — FROM.** `packages/activerecord/src/relation.ts` (~L4068): `from()`
is applied by a `sql.replace(/FROM …/, …)` regex (matching ANSI `"…"` /
backtick-quoted identifiers) on the **already-compiled** SELECT string. Because the FROM never
reaches the arel manager, `pluck` (relation.ts ~L3128) builds its projection off
`table` (= `arel_table`) and never sees `from()` or CTEs. Rails sets FROM on the
manager **before** compilation via `build_from` (`query_methods.rb` L1783):

```ruby
def build_from
  opts = from_clause.value
  name = from_clause.name
  case opts
  when Relation
    opts = opts.apply_join_dependency if opts.eager_loading?
    name ||= "subquery"
    opts.arel.as(name.to_s)
  else
    opts
  end
end
```

### What already exists in `packages/arel`

This is the key reason the work is tractable and low-risk — **the target nodes
and visitors are already implemented and tested**:

- `Nodes.Union` / `Nodes.UnionAll` / `Nodes.Intersect` / `Nodes.Except`
  (`packages/arel/src/nodes/binary.ts` L214/223/232/259), exported via
  `packages/arel/src/nodes/index.ts` (L57–60).
- `SelectManager#union` / `#unionAll` / `#intersect` / `#except` / `#minus`
  (`packages/arel/src/select-manager.ts` L359/502/367/375/508).
- Visitors: `to-sql.ts` registers and implements
  `visitArelNodesUnion`/`UnionAll`/`Intersect`/`Except` (L344–347, L517–536) —
  union/union-all via `infixValueWithParen`, intersect/except wrapped `( … )`.
- The **SQLite** visitor overrides `infixValueWithParen`
  (`packages/arel/src/visitors/sqlite.ts` L89) to **strip a `Grouping` wrapper**
  off compound-SELECT operands (mirroring Rails `sqlite.rb#infix_value_with_paren`
  — SQLite rejects parens around UNION/INTERSECT/EXCEPT operands); covered by
  `packages/arel/src/visitors/sqlite.test.ts`.
- `SelectManager#with` / `#withRecursive` and `Nodes.Cte` already exist
  (`select-manager.ts`; `query-methods.ts` `buildWith`).

So none of the three clusters needs new arel node types — they need the
activerecord relation to **build the AST and run it through the existing
visitor** instead of post-processing strings.

## Design

### Cluster 1 — CTE build-with expression as Arel AST

Port `build_with_expression_from_value` faithfully so a CTE value resolves to an
**arel expression**, not a SQL string:

- Single-element array → unwrap to the one element.
- Multi-element array → `reduce` into left-nested `Nodes.UnionAll`.
- `Relation` → contribute its `arel` (or `.ast` when nested, i.e. inside a
  `UnionAll` operand).
- `SqlLiteral` (a raw SQL string today) → `Nodes.Grouping(sqlLiteral)`.

Change `_ctes` to carry the resolved arel expression (alongside `name` /
`recursive`) rather than a pre-rendered SQL string, and update `buildWith` to
build `Nodes.Cte` / `TableAlias` over that expression so the **visitor** renders
the body — deleting the `arelSql(c.sql)` string re-wrap. The existing SQLite
`Grouping`-stripping path then handles the paren/Grouping concern for free.

**Cross-adapter:** the `Grouping` → SQLite-strip behavior is the only
adapter-sensitive piece and is already implemented + tested in arel; PG/MySQL
accept the grouped/parenthesized operands. Binds from sub-query Relations now
flow through the collector instead of being baked into a string.

### Cluster 2 — set operations as Arel binary nodes

Replace the `_toSql` `_setOperation` branch with arel composition:

- Build the left and right operands as arel ASTs (each side's `SelectManager` /
  `SelectStatement`), then compose `manager.union(other)` / `.unionAll(other)` /
  `.intersect(other)` / `.except(other)` to get the `Nodes.Union*` node.
- Run the composed node through the visitor to get SQL **and** binds in one pass,
  eliminating: (a) the string operator table, (b) the
  `(left) OP (right)` vs `left OP right` paren templating (the visitor's
  `infixValueWithParen` + the SQLite override own this), and (c) the
  `rightSql.replace(/\$(\d+)/g, …)` PG placeholder renumbering — a single
  collector numbers all binds globally by construction.

**Cross-adapter:** SQLite paren-stripping and PG/MySQL parenthesization are
already differentiated in the visitors. PG `$N` numbering becomes a non-issue
because both sides share one collector. The trails set-op spawn methods
(`union`/`unionAll`/`intersect`/`except`) keep their public signatures; only the
compile path changes. Note: trails exposes these as `Relation` methods (Rails
core ActiveRecord composes the same `Arel::Nodes::Union*` at the arel layer; the
node semantics are what we mirror).

### Cluster 3 — FROM on the manager pre-compile

Port `build_from`: set FROM on the arel `SelectManager` **before** compilation
(`arel.from(opts)` / `opts.arel.as(name)` for a Relation subquery) instead of
regex-replacing the compiled string. Because the FROM then lives on the manager,
every read path that builds from the manager — `toArray`, `count`, and crucially
`pluck` — picks it up. The follow-on `pluck` change makes `pluck` build its
projection/manager so `from()` and CTE clauses thread through, removing the
PR #3105 deviation that forced `order("id").toArray()` + id extraction in place
of `pluck(:id)`.

**Cross-adapter:** identifier quoting (ANSI `"…"` vs MySQL backticks) currently
lives in the regex; moving FROM onto the manager hands quoting to the visitor's
`quoteColumnName`/table quoting, which is already adapter-correct. Subquery
binds (a `from(relation)`) flow through the collector rather than being spliced
into the string.

## Rollout

1. **Independent cluster heads (P1):** `cte-build-with-expression-ast`,
   `set-operations-arel-nodes`, `from-clause-arel-manager` head the three
   clusters. All three edit regions of `relation.ts`/`query-methods.ts`, so
   coordinate to keep diffs non-overlapping or ship sequentially if conflicts
   arise (CLAUDE.md: no stacked PRs).
2. **Dependent follow-ons (P2):** `set-operations-bind-threading` (after the
   set-op nodes land) and `pluck-from-cte-threading` (after FROM moves onto the
   manager).
3. **Verification (P3):** `arel-ast-convergence-verify` confirms no parity
   regression across all three clusters.

Each story is a **cluster** (the claimable unit is one PR ≤ 500 LOC); large
clusters register continuation stories via `pnpm tasks new`. Stories cite their
Rails source counterpart and the relevant test assertions.

## Alternatives considered

- **Keep the string patches (status quo + PR #3105's `UNION ALL` fix).**
  Rejected: leaves three fidelity gaps, keeps the `pluck`-ignores-`from()` bug,
  and re-derives bind/paren correctness by hand per call site instead of once in
  the visitor.
- **Add new arel nodes.** Unnecessary — `Union`/`UnionAll`/`Intersect`/`Except`,
  their visitors, the SQLite `Grouping` strip, and `SelectManager` set-op/`from`
  helpers all already exist and are tested. The gap is purely on the
  activerecord side.
- **One mega-story for all three clusters.** Rejected: well over the 500-LOC
  ceiling and three independent code paths; slicing per cluster (with bind /
  pluck follow-ons split out) keeps each PR reviewable.

## Open questions

1. **`from(relation)` subquery binds.** Moving FROM onto the manager means a
   `from(subquery)`'s binds flow through the outer collector; confirm ordering
   vs WHERE binds matches the current explicit `[...fromBinds, ...selectBinds]`
   prepend (relation.ts ~L4059). Recommendation: assert via the from-clause
   tests with a parameterized subquery on PG.
2. **Set-op retryability flag.** `_setOperation` currently forces
   `allowRetry = false` (relation.ts L2280). Preserve that semantics when the
   compile path moves to arel.

## Changelog

- 2026-06-10: initial RFC; triggered by PR #3105.
