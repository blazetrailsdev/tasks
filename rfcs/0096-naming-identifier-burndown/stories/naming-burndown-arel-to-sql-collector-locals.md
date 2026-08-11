---
title: "to_sql: name the collector locals c, as Rails' compile and SelectStatement fold do"
status: done
updated: 2026-08-11
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6370
claim: "2026-08-11T17:44:26Z"
assignee: "pg-reset-body-under-one-lock"
blocked-by: null
closed-reason: null
---

## Context

Residue measured while landing PR #6358 (`naming-burndown-arel-to-sql`), which
renamed every `visit_*` first parameter in `packages/arel/src/visitors/to-sql.ts`
from `node` to `o` and dropped the file's `naming` rows from 30 to 12.

Two of the twelve survivors are LOCAL spellings, not first parameters, so they
were out of that story's scope (its AC1 is the `o` parameter). Both are Rails
locals the port renamed:

- `compile` (`to-sql.ts`, Rails `arel/visitors/to_sql.rb:17`
  `def compile(node, collector = Arel::Collectors::SQLString.new)`): the port
  introduces `const c = collector as unknown as SQLString` and calls
  `this.accept(node, c)` where Rails calls `accept(node, collector)`. The cast
  local has no Rails counterpart; casting at the call site keeps Rails' argument.
- `visit_Arel_Nodes_SelectStatement` (`to_sql.rb:110-118`): Rails folds the cores
  with `o.cores.inject(collector) { |c, x| visit_Arel_Nodes_SelectCore(x, c) }`,
  naming the accumulator `c`; the port passes `collector`.

Both surface as `class: "naming"` rows in
`pnpm parity:api:calls:args:report` for `visitors/to-sql.ts`. They entered the
comparable set with #6362, which routed the statement visitors through the Rails
helpers.

## Acceptance criteria

1. `compile` passes `collector` to `accept` as Rails does, with the cast (if
   still needed) applied at the call site rather than bound to an invented local.
2. `visit_Arel_Nodes_SelectStatement`'s core fold names its accumulator `c`,
   mirroring `to_sql.rb:110-118`.
3. The two `naming` rows for `visitors/to-sql.ts` disappear;
   `pnpm parity:api:calls:args` stays green and the row count strictly decreases.
4. No behaviour change — `pnpm vitest run packages/arel/src/visitors` green.
