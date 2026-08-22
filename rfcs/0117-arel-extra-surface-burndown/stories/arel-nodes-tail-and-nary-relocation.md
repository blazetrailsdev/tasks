---
title: "Relocate And/Or into nary.ts and retire the nodes/* novel tail"
status: claimed
updated: 2026-08-22
rfc: "0117-arel-extra-surface-burndown"
cluster: null
packages: ["arel"]
deps: ["arel-node-accept-removal-members"]
deps-rfc: []
est-loc: 200
priority: 9
pr: null
claim: "2026-08-22T17:05:00Z"
assignee: "query-methods-order-only-call-inversions"
blocked-by: null
closed-reason: null
---

## Context

The node-file residue after the two `accept`-removal stories and the
conventions story — every remaining `nodes/*.ts` extra
(`pnpm parity:api:extra --package arel`, 2026-08-22).

**Mis-located classes** (triage category 2). Rails defines both `And` and `Or`
in `vendor/rails/activerecord/lib/arel/nodes/nary.rb:36-37`
(`And = Class.new(Nary)`, `Or = Class.new(Nary)`) — there is no `and.rb` or
`or.rb` in `vendor/rails/activerecord/lib/arel/nodes/`. trails splits them
into `packages/arel/src/nodes/and.ts` (14 lines, extras `And`, `as`) and
`packages/arel/src/nodes/or.ts` (25 lines, extras `Or`, `constructor`), both
reported with `rubyFile: null`. Move both classes into
`packages/arel/src/nodes/nary.ts` and delete the two files; that credits all
4 extras and drops `noCounterpartFiles` by 2.

**Novel names to retire:**

| name                       | file                        | note                                                      |
| -------------------------- | --------------------------- | --------------------------------------------------------- |
| `registerNodeDeps`         | `nodes/node.ts`             | trails wiring; Rails has no such call                     |
| `registerBuildQuoted`      | `nodes/node-expression.ts`  | ditto                                                     |
| `registerBinaryInversions` | `nodes/binary.ts`           | ditto                                                     |
| `fetchAttributeFromBinary` | `nodes/binary.ts`           | Rails inlines `fetch_attribute` in `binary.rb`            |
| `CrossJoin`                | `nodes/binary.ts`           | not a Rails node class — check `nodes.rb` before deleting |
| `retryableFlag`, `toYAML`  | `nodes/sql-literal.ts`      | `sql_literal.rb` has neither                              |
| `hints`, `Top`             | `nodes/unary.ts`            | check `unary.rb`'s subclass list                          |
| `SelectOptions`            | `nodes/select-statement.ts` | TS-only options type                                      |
| `Index`                    | `nodes/index.ts`            | barrel re-export; dies with its source                    |

The three `register*` functions are one shape: module-level registration calls
that exist because ESM has no Zeitwerk. Before deleting, read CLAUDE.md's
"Call-time constant resolution" section — if one of them genuinely breaks a
require cycle, the **zero-import slot** is the sanctioned shape, not a
registration function, and only two slots exist in the repo today.

## Acceptance criteria

- `nodes/and.ts` and `nodes/or.ts` deleted, `And` / `Or` living in
  `nodes/nary.ts` beside `Nary`, matching `nary.rb:36-37`.
- All novel names above deleted, inlined, or converted to a zero-import slot
  per CLAUDE.md; each disposition stated in the PR body with its Rails
  citation.
- `pnpm parity:api:extra --package arel`: `nodes/**` reports **0 novel**, and
  `noCounterpartFiles` drops by 2.
- `pnpm typecheck` clean and `pnpm vitest run packages/arel` green — verify
  the registration removals against a **built** `dist/**.js` plain-node import
  in both directions, not just vitest, per CLAUDE.md (a vitest run enters the
  funnel module first and masks a TDZ).
- At most 1 new tag from the RFC budget.
