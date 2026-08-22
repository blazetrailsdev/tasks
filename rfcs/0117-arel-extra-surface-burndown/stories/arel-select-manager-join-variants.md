---
title: "Fold select-manager's join/union convenience methods into their Rails shapes"
status: claimed
updated: 2026-08-22
rfc: "0117-arel-extra-surface-burndown"
cluster: null
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 200
priority: 6
pr: null
claim: "2026-08-22T15:47:08Z"
assignee: "converge-lazy-alias-attribute-method-generation"
blocked-by: null
closed-reason: null
---

## Context

`packages/arel/src/select-manager.ts` — 20 extras, 7 novel, 13 moved
(`pnpm parity:api:extra --package arel`, 2026-08-22).
Rails: `vendor/rails/activerecord/lib/arel/select_manager.rb`.

Novel, with TS line numbers:

| name               | line                    | Rails position                                                                                                      |
| ------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `rightOuterJoin`   | `select-manager.ts:472` | Rails has `join(relation, klass = Nodes::InnerJoin)` — the join _class_ is the argument, not a method per join type |
| `fullOuterJoin`    | `:482`                  | same                                                                                                                |
| `crossJoin`        | `:492`                  | same                                                                                                                |
| `unionAll`         | `:509`                  | Rails: `union(operation = :union, other)` — `union(:all, other)`                                                    |
| `appendStringJoin` | `:595`                  | no counterpart                                                                                                      |
| `prependJoinNodes` | `:605`                  | no counterpart                                                                                                      |
| `appendJoinNode`   | `:615`                  | no counterpart                                                                                                      |

The first four are Rails methods reshaped into per-variant convenience
methods — triage category 3 (fold into the ported method: pass the join class
/ the `:all` operation instead of adding a method). The last three are
category 1 (delete, or make module-private) unless a caller proves otherwise;
`grep -rn "appendJoinNode\|prependJoinNodes\|appendStringJoin"
packages/*/src` before deciding, and if ActiveRecord depends on one, the
correct fix is to make the AR call site do what Rails' AR call site does.

Moved (13): `ast`, `cast`, `coalesce`, `createAnd`, `createFalse`,
`createJoin`, `createOn`, `createStringJoin`, `createTableAlias`,
`createTrue`, `grouping`, `lower`, `withRecursive`. Most are
`Arel::FactoryMethods` / `TreeManager` members Rails defines in
`arel/factory_methods.rb` and `arel/tree_manager.rb` — a _file-layout_
question (triage category 2). Check `PATH_SEGMENT_ALIASES` /
`RUBY_FILE_TS_OVERRIDES` in `docs/ruby-ts-conventions.md`; if the mixin is
included on the TS class rather than living in the file matching its `.rb`,
that is the drift.

## Acceptance criteria

- All 7 novel names on `select-manager.ts` retired: the join variants and
  `unionAll` fold into `join` / `union` at their Rails signatures; the three
  `*JoinNode*` helpers are deleted or module-private.
- `pnpm parity:api:extra --package arel` for `select-manager.ts`: novel
  **7 → 0**.
- Callers in `packages/activerecord/src` updated to the Rails-shaped call.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` clean — folding a
  helper into a ported body changes its call set, and this is exactly the case
  those gates watch.
- `pnpm vitest run packages/arel packages/activerecord/src/relation` green.
- No new `@noRailsEquivalent` tag.
