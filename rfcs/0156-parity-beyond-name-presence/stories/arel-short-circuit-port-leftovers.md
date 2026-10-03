---
title: "arel: 14 bodies carry a short-circuit their Rails body does not (default params, rtest, invented fallbacks)"
status: done
updated: 2026-10-03
rfc: "0156-parity-beyond-name-presence"
cluster: arms
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: trails#8429
claim: "2026-10-03T00:02:05Z"
assignee: "arel-short-circuit-extractor-folds"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=arel` prints a **Short-circuit mismatches** table. On trails `main`
@ `0d0353b79e` it lists 41 arel rows. 26 are extractor misreads (`arel-short-circuit-extractor-folds`) and
one is `arel-visitor-dispatch-cache-invented-arms`. The 14 below are real: each TS body has an `&&` / `||` /
`??` / `??=` that its Rails body does not. None changes behaviour today, and each converges in about one line.

### Ruby default parameters spelled as `?? x`

- `insert-manager.ts#constructor`: `table ?? null`. Rails `def initialize(table = nil)` (`insert_manager.rb:5`).
- `select-manager.ts#constructor`: `table ?? null`. Rails `def initialize(table = nil)` (`select_manager.rb:9`).
- `nodes/named-function.ts#constructor`: `aliaz ?? null`. Rails `def initialize(name, expr, aliaz = nil)` (`nodes/named_function.rb:8`).
- `nodes/sql-literal.ts#constructor`: `options?.retryable ?? false`. Rails `retryable: false` (`nodes/sql_literal.rb:13`).
- `table.ts#alias`: ``name ?? `${this.name}_2` ``. Rails `def alias(name = "#{self.name}_2")` (`table.rb:30`). A TS default parameter can read `this`.

### Ruby truthiness hand-rolled instead of `rtest`

- `select-manager.ts#distinct` and `#distinctOn`: `value === false || value == null ? null : …`. Rails `if value` (`select_manager.rb:154-170`).
- `visitors/visitor.ts#visit`: `collector != null && collector !== false`. Rails `if collector` (`visitors/visitor.rb:30-34`).

### Invented fallbacks, lazy initialisation, or a hand-rolled core method

- `tree-manager.ts#where`: `(this.ast.wheres ??= []).push(expr)`. Rails `@ast.wheres << expr` (`tree_manager.rb:39-42`).
- `nodes/homogeneous-in.ts#procForBinds`: `attribute.name ?? ""`. Rails `attribute.name` (`nodes/homogeneous_in.rb:50-52`).
- `visitors/to-sql.ts#visitArelNodesSelectCore` `+or +or`: `o.setQuantifier ?? null` and `o.comment ?? null`. Rails `maybe_visit o.set_quantifier` / `maybe_visit o.comment` (`visitors/to_sql.rb:153,167`).
- `select-manager.ts#collapse`: `.filter((expr) => expr !== null && expr !== undefined)`. Rails `exprs.compact` (`select_manager.rb:259`); ruby-compat exports `compact`.
- `nodes/bound-sql-literal.ts#constructor`: `(sql.match(/\?/g) ?? []).length`. Rails `sql_with_placeholders.count("?")` (`nodes/bound_sql_literal.rb:16`); ruby-compat exports `strCount`.

### Borderline

- `nodes/bound-sql-literal.ts#inspect`: `this.namedBinds && symbolizeKeys(this.namedBinds)`. Rails `(named_binds || positional_binds).inspect` (`nodes/bound_sql_literal.rb:60-62`) has no symbolize step; trails adds it so the keys render as `:name`. Drop it if `inspect` still matches the Rails test. Otherwise report it in the PR with the Rails `file:line`, and do not add a receipt.

## Acceptance criteria

- [ ] Each row above matches its Rails body's short-circuits: default parameters for Ruby defaults, `rtest`
      for Ruby truthiness, ruby-compat `compact` / `strCount` for the core methods, and no fallback Rails lacks.
- [ ] Where removing a `??` exposes a field that can be `undefined` (`setQuantifier`, `comment`, `wheres`),
      the field is initialised the way Rails' constructor initialises it, not guarded at the read.
- [ ] `pnpm parity:api:arms:report --package=arel` lists none of these 14 rows (the `inspect` row excepted if
      it is reported), and shows no new arm or short-circuit row.
- [ ] `pnpm vitest run packages/arel` and `pnpm parity:api:calls` green.

## Verification

```bash
pnpm build && pnpm parity:api --calls && pnpm parity:api:arms:report --package=arel
pnpm vitest run packages/arel && pnpm parity:api:calls && pnpm parity:api:extra:gate
```
