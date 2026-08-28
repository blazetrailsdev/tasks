---
title: "arel: the 9 node-slot/registry guards Rails' bodies have no raise for"
status: done
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 7148
claim: "2026-08-28T01:46:55Z"
assignee: "arel-crud-interface-holds-no-bodies"
blocked-by: null
closed-reason: null
---

## Context

Enrolling `blazetrails/rails-error-parity` on arel (PR #7131) surfaced 9 throw
sites in `packages/arel/src` that Rails has **no counterpart for at all** —
they guard trails' late-binding node-slot / registry machinery, which Ruby does
not need because Zeitwerk resolves the constant when the method runs
(`vendor/rails/activerecord/lib/arel/nodes/node.rb:129-131`,
`nodes/binary.rb:25-29`, `nodes/casted.rb:48-52`,
`arel/tree_manager.rb:57-61`).

PR #7131 converged them from the bare global `Error` to `ArelError`
(`arel/errors.rb:4`) so the rule could be enrolled, but the guard itself is
still invented surface:

- `nodes/binary.ts` — `As#toCte` (cteFactory registry), `NotEqual#invert`
  (`_Equality`), `NotIn#invert` (`_In`)
- `nodes/node.ts` — `assertRegistered` (`_Not` / `_Grouping` / `_Or` / `_And`)
- `nodes/node-expression.ts` — `quotedNode` (`_buildQuoted`)
- `tree-manager.ts` — `toDot` (`_Dot`)
- `nodes/case.ts` — `Case#then called before Case#when`
- `visitors/to-sql.ts` — `registerDispatch`'s prototype-method check
- `visitors/dot.ts` — `Dot: edge has no destination node`

Rails' bodies at each of these sites have no `raise` and no guard: `to_cte`
just calls `Cte.new(left.name, right)` (binary.rb:43-45), `NotEqual#invert`
just calls `Equality.new(left, right)` (binary.rb:25-29), `TreeManager#to_dot`
just calls `Visitors::Dot.new.accept(...)` (tree_manager.rb:57-61).

Sibling story: `arel-collectors-and-grouping-invented-guards` covers the same
class of divergence in the collectors / Grouping code.

## Acceptance criteria

- Each guard above is removed, or reduced to the shape Rails' own body has at
  that line, cited `file.rb:LINE` at the call site.
- If a slot genuinely can be unset at call time in a way Ruby's autoload cannot
  be, that is written down once — do not re-derive a per-site justification, and
  do not ratify all 9 by keeping them.
- `pnpm eslint packages/arel/src --max-warnings 0` stays green with no
  `rails-error-parity` exclude row.
- arel test suite green; `pnpm parity:api:extra:gate` no worse.
